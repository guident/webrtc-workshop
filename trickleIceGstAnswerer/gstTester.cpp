#include <string.h>
#include <gtk/gtk.h>
#include <gst/gst.h>
#include <gdk/gdk.h>

/* Structure to contain all our information, so we can pass it around */
typedef struct _CustomData {
    GstElement *playbin;           /* Pipeline for remote video */
    GstElement *local_pipeline;    /* Pipeline for local webcam video */
    GtkWidget *sink_widget;        /* Widget for the remote video */
    GtkWidget *local_sink_widget;  /* Widget for the local webcam video */
    GstState state;                /* Current state of the pipeline */
    gint64 duration;               /* Duration of the clip, in nanoseconds */
} CustomData;

/* Callback function prototypes */
static void delete_event_cb(GtkWidget *widget, GdkEvent *event, CustomData *data);
static void create_ui(CustomData *data);
static void error_cb(GstBus *bus, GstMessage *msg, CustomData *data);
static void eos_cb(GstBus *bus, GstMessage *msg, CustomData *data);
static void state_changed_cb(GstBus *bus, GstMessage *msg, CustomData *data);
static void application_cb(GstBus *bus, GstMessage *msg, CustomData *data);

int main(int argc, char *argv[]) {
    CustomData data;
    GstStateChangeReturn ret;
    GstBus *bus;
    GstElement *gtkglsink, *videosink;

    /* Initialize GTK */
    gtk_init(&argc, &argv);

    /* Initialize GStreamer */
    gst_init(&argc, &argv);

    /* Initialize our data structure */
    memset(&data, 0, sizeof(data));
    data.duration = GST_CLOCK_TIME_NONE;

    /* Create the elements for remote video */
    data.playbin = gst_element_factory_make("playbin", "playbin");
    videosink = gst_element_factory_make("glsinkbin", "glsinkbin");
    gtkglsink = gst_element_factory_make("gtkglsink", "gtkglsink");

    if (gtkglsink != NULL && videosink != NULL) {
        g_printerr("Successfully created GTK GL Sink\n");
        g_object_set(videosink, "sink", gtkglsink, NULL);
        g_object_get(gtkglsink, "widget", &data.sink_widget, NULL);
    } else {
        g_printerr("Could not create gtkglsink, falling back to gtksink.\n");
        videosink = gst_element_factory_make("gtksink", "gtksink");
        g_object_get(videosink, "widget", &data.sink_widget, NULL);
    }

    if (!data.playbin || !videosink) {
        g_printerr("Not all elements could be created.\n");
        return -1;
    }

    /* Set the URI to play for remote video */
    g_object_set(data.playbin, "uri", "https://gstreamer.freedesktop.org/data/media/sintel_trailer-480p.webm", NULL);
    g_object_set(data.playbin, "video-sink", videosink, NULL);

    /* Create the elements for local webcam */
    data.local_pipeline = gst_pipeline_new("local_pipeline");
    GstElement *local_source = gst_element_factory_make("v4l2src", "local_source");
    g_object_set(local_source, "device", "/dev/video1", NULL); // Set the correct device path for the webcam
    GstElement *local_convert = gst_element_factory_make("videoconvert", "local_convert");
    GstElement *local_sink = gst_element_factory_make("gtksink", "local_sink");
    g_object_get(local_sink, "widget", &data.local_sink_widget, NULL);

    if (!data.local_pipeline || !local_source || !local_convert || !local_sink) {
        g_printerr("Not all elements for local webcam could be created.\n");
        return -1;
    }

    gst_bin_add_many(GST_BIN(data.local_pipeline), local_source, local_convert, local_sink, NULL);
    if (!gst_element_link_many(local_source, local_convert, local_sink, NULL)) {
        g_printerr("Local webcam elements could not be linked.\n");
        gst_object_unref(data.local_pipeline);
        return -1;
    }

    /* Connect to interesting signals in playbin */
    bus = gst_element_get_bus(data.playbin);
    gst_bus_add_signal_watch(bus);
    g_signal_connect(G_OBJECT(bus), "message::error", (GCallback)error_cb, &data);
    g_signal_connect(G_OBJECT(bus), "message::eos", (GCallback)eos_cb, &data);
    g_signal_connect(G_OBJECT(bus), "message::state-changed", (GCallback)state_changed_cb, &data);
    g_signal_connect(G_OBJECT(bus), "message::application", (GCallback)application_cb, &data);
    gst_object_unref(bus);

    /* Create the GUI */
    create_ui(&data);

    /* Start playing */
    ret = gst_element_set_state(data.playbin, GST_STATE_PLAYING);
    if (ret == GST_STATE_CHANGE_FAILURE) {
        g_printerr("Unable to set the remote video pipeline to the playing state.\n");
        gst_object_unref(data.playbin);
        gst_object_unref(videosink);
        return -1;
    }

    ret = gst_element_set_state(data.local_pipeline, GST_STATE_PLAYING);
    if (ret == GST_STATE_CHANGE_FAILURE) {
        g_printerr("Unable to set the local webcam pipeline to the playing state.\n");
        gst_object_unref(data.local_pipeline);
        return -1;
    }

    /* Start the GTK main loop. We will not regain control until gtk_main_quit is called. */
    gtk_main();

    /* Free resources */
    gst_element_set_state(data.playbin, GST_STATE_NULL);
    gst_object_unref(data.playbin);
    gst_element_set_state(data.local_pipeline, GST_STATE_NULL);
    gst_object_unref(data.local_pipeline);

    return 0;
}

static void create_ui(CustomData *data) {
    GtkWidget *main_window;  /* The uppermost window, containing all other windows */
    GtkWidget *fixed_container; /* Fixed container to position widgets */

    main_window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    g_signal_connect(G_OBJECT(main_window), "delete-event", G_CALLBACK(delete_event_cb), data);

    fixed_container = gtk_fixed_new();
    gtk_fixed_put(GTK_FIXED(fixed_container), data->sink_widget, 0, 0);
    gtk_widget_set_size_request(data->sink_widget, 640, 480); // Set size for remote video
    gtk_fixed_put(GTK_FIXED(fixed_container), data->local_sink_widget, 500, 360);
    gtk_widget_set_size_request(data->local_sink_widget, 140, 120); // Set size for local webcam

    gtk_container_add(GTK_CONTAINER(main_window), fixed_container);
    gtk_window_set_default_size(GTK_WINDOW(main_window), 640, 480);

    gtk_widget_show_all(main_window);
}

/* Definitions for the callback functions */
static void delete_event_cb(GtkWidget *widget, GdkEvent *event, CustomData *data) {
    gtk_main_quit();
}

static void error_cb(GstBus *bus, GstMessage *msg, CustomData *data) {
    GError *err;
    gchar *debug_info;

    /* Print error details on the screen */
    gst_message_parse_error(msg, &err, &debug_info);
    g_printerr("Error received from element %s: %s\n", GST_OBJECT_NAME(msg->src), err->message);
    g_printerr("Debugging information: %s\n", debug_info ? debug_info : "none");
    g_clear_error(&err);
    g_free(debug_info);

    /* Set the pipeline to READY (which stops playback) */
    gst_element_set_state(data->playbin, GST_STATE_READY);
}

static void eos_cb(GstBus *bus, GstMessage *msg, CustomData *data) {
    g_print("End-Of-Stream reached.\n");
    gst_element_set_state(data->playbin, GST_STATE_READY);
}

static void state_changed_cb(GstBus *bus, GstMessage *msg, CustomData *data) {
    GstState old_state, new_state, pending_state;
    gst_message_parse_state_changed(msg, &old_state, &new_state, &pending_state);
    if (GST_MESSAGE_SRC(msg) == GST_OBJECT(data->playbin)) {
        data->state = new_state;
        g_print("State set to %s\n", gst_element_state_get_name(new_state));
    }
}

static void application_cb(GstBus *bus, GstMessage *msg, CustomData *data) {
    // Handle application messages if needed
}
