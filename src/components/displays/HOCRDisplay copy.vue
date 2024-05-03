<template>
    <div class="viewport">
      <div class="toolbar">
        <div class="logo">hOCR-Proofreader</div>
  
        <button @click="toggleLayout">Image/Text</button>
        <div class="separator"></div>
  
        <span>Zoom:</span>
        <button @click="zoomPage('full')">Full Page</button>
        <button @click="zoomPage('width')">Page Width</button>
        <button @click="zoomPage('original')">Original</button>
        <div class="separator"></div>
  
        <button @click="save">Save</button>
      </div>
  
      <div ref="layoutContainer" class="container"></div>
      <div ref="editorContainer" class="container"></div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';

  // Import external JavaScript files
   import { HocrProofreader } from './hocr-proofreader.js';
//   //import main from './main.js';

    const layoutContainer = ref(null);
    const editorContainer = ref(null);

   const hocrBaseUrl = 'http://localhost:3000/';


  onMounted(async()=> {
    var hocrProofreader = new HocrProofreader({
        layoutContainer: layoutContainer.value,
        editorContainer: editorContainer.value
    });   
    var hocr =  await fetch('/api/files/40:7')
    hocr = await hocr.text();
    hocrProofreader.setHocr(hocr, hocrBaseUrl);  
  })

  </script>
  
  <style scoped>
  /* Import external CSS files */
  @import url('./fonts.css');
  @import url('./main.css');
  @import url('./editor.css');
  @import url('./hocr-proofreader.css');
  </style>
  