<style scoped>
  canvas {background-color: rgb(245, 244, 243);}
</style>

<template>

  <v-container>
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row>

        <v-col cols="9" >
          <canvas id="canvas" height="800" width="1000" ref="canvas" >
          </canvas>
        </v-col>

        <v-col cols="3">
          <template v-if="state.cruncher">
            <v-card>
                <v-card-title>{{ state.cruncher.label }}</v-card-title>
                <v-card-text>{{ state.cruncher.info }}</v-card-text>

                <div v-if="state.data">faces: {{ state.data.face.length }}</div>

              
                <v-card v-for="(value, key) of state.data.face">
                  <v-card-title>{{ key }}</v-card-title>
                  <v-card-text>
                    
                    gender: {{ value.gender }}<br>
                    age: {{ value.age }}<br>
                    <div v-for="emotion in value.emotion">
                      {{ emotion.emotion }}: {{ emotion.score }}
                    </div>
                  </v-card-text>

                
                </v-card>

            </v-card>
          </template>
        </v-col>  

      </v-row>
    </v-container>


  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
  
    import web from "../../web.js";
    const apiUrl = import.meta.env.VITE_API_PATH;

    const route = useRoute();
    const canvas = ref(null)

    var state = reactive({
        data: null,
        file: null,
        cruncher: null,
        width: 0
    })

    function drawImage(ev)  {
      const ctx = canvas.value.getContext('2d');

      // Draw the image on the canvas
      const image = new Image();
      image.src = state.file.thumbnail;
      image.onload = () => {

        const canvasWidth = canvas.value.width;
        const canvasHeight = canvas.value.height;
        const imageWidth = image.width;
        const imageHeight = image.height;

        const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
       
        const x = (canvasWidth / 2) - (imageWidth / 2) * scale;
        const y = (canvasHeight / 2) - (imageHeight / 2) * scale;
        const width = imageWidth * scale;
        const height = imageHeight * scale;
        ctx.drawImage(image, x, y, width, height);

        drawRects(ctx, width, height, x, y)
        state.width = image.width
        state.height = image.height
      };

  
  };

  function drawRects(ctx, width, height, x, y) {
    var count = 0 
      for(var face of state.data.face) {

        const rectX = x + face.boxRaw[0] * width;
        const rectY = y + face.boxRaw[1] * height;
        const rectWidth = face.boxRaw[2] * width;
        const rectHeight = face.boxRaw[3] * height;

        ctx.lineWidth = 2
        ctx.strokeStyle = 'yellow'
        ctx.fillStyle = "green";
        
        // draw number box
        ctx.beginPath()
        ctx.rect(rectX, rectY, 20, 20)
        ctx.fill()
        ctx.stroke()

        // draw number
        ctx.font = "18px serif";
        ctx.fillStyle = "white";
        ctx.fillText(count, rectX + 4, rectY + 17,);

        // draw area
        ctx.beginPath()
        ctx.rect(rectX, rectY, rectWidth, rectHeight);
        ctx.stroke()

        count++
      }

  }


    onMounted(async()=> {

      
      var response = await web.getDocInfo(route.params.rid)
      var source_image = await web.getDocInfo(route.query.source)
      state.data = await web.getFiles(route.params.rid)
      //state.json = JSON.parse(state.data.replace(/'/g, '"'))
      
      state.file = response
      state.file.thumbnail = removeLastPathPart(source_image.path.replace('data/', apiUrl + '/api/thumbnails/'))
      if(route.query.cruncher) {
        var response2 = await web.getDocInfo(route.query.cruncher)
        state.cruncher = response2
      }
      drawImage()

    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }
  </style>