# Image ROI editor

Create ImageROIDisplay.vue

The purpose of the Image ROi editor is to allow user to define regions of interest in images.

This is a Display component, other displays are here: src/displays


# Functionality
Editor open when user clicks "Open" button in Filter node @FilterNode.vue
Filter node can be attached to single image or set of images.
If parent node of Filter node is Set, then user can browse through images in set (see @ImageDisplay.vue)

There are two modes: individual mode and template mode that user must choose.
Default mode is individual regions.

In both modes user User can draw rectangles, circles and polygons over the image. The default selection is rectangle.

User can move regions and edit them. User can use arrow buttons to move to next and previous images.

If user chooses template mode, then region does not change where user moves to next image. There is a button "override" which allows user to disable template for that spesific image and draw individual regions.


## Layout
Image is displayed on left and tools are on the right.

## Drawing ROIS



User can mode regions and edit them.

## template

User can define region template for images. 

# backend
path: '/api/graph/vertices/{rid}/rois'
Backend creates JSON files (one per image). 
1. First get image metadata
2. Then file name is created based on image RID.
filename = "ROI_" + RID + ".json"

{
    mode:"individual",
    regions: [
        {type: rectangle, label:"region 1", data:[]}

],
image_shape: [1456, 2334]
}

Do not implement backend yet.


