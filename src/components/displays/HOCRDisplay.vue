<template>
  <v-row>
    <v-card class="overflow-auto p-3" width="100dvh">

      <v-btn
          class="text-none text-subtitle-1"
          color="#5865f2"
          size="small"
          variant="flat"
        >
          Save corrected text
        </v-btn>
    </v-card>
  </v-row>
  <v-row>

    <v-col cols="col-6">
      <v-card class="overflow-auto" height="100dvh">
        <v-card-text>
          
            <img ref="page_image" class="page_image" @load="onImgLoad" v-if="state.file" :src="state.file.original" alt="Image" />
            {{ state.page_images }}

          
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="col-6">
      <v-card class="overflow-auto" height="100dvh">
        <v-card-text>
          <div ref="editor"@click="onclick" v-html="state.hocr"></div>
        </v-card-text>
      </v-card>
    </v-col>

  </v-row>
</template>
  
  <script setup>

    // heavily based on: https://github.com/rescribe/proofreader

    import { ref, onMounted, onUpdated, reactive } from 'vue';
    import { useRouter, useRoute } from 'vue-router'
  
    import web from "../../web.js";

    const route = useRoute();

    const hocrBaseUrl = 'http://localhost:3000/';

    const state = reactive({
      hocr: null,
      hocr_rendered: false,
      file: null,
      page_images: []
    })

    const editor = ref(null);
    const page_image = ref(null);

    function addlineimgs(page, img) {

        var c
        var ctx
        var i
        var lines
        var start
        var end
        var bbox
        var width
        var height
        var scaledown

        scaledown = img.naturalWidth / 800

        console.log('scaledown', scaledown)

        lines = editor.value.getElementsByClassName("ocr_line")
        for (i = 0; i < lines.length; i++) {
          bbox = titletobbox(lines[i].title)


          c = document.createElement("canvas")
          c.dataset.scaledown = scaledown
          c.setAttribute('width', bbox.width/scaledown)
          c.setAttribute('height', bbox.height/scaledown)
          ctx = c.getContext("2d")
          ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width/scaledown, bbox.height/scaledown)
          lines[i].parentNode.insertBefore(c, lines[i])
          lines[i].parentNode.style.width = bbox.width/scaledown + 'px'
        }

        lines = editor.value.getElementsByClassName("ocr_textfloat")
        for (i = 0; i < lines.length; i++) {
          bbox = titletobbox(lines[i].title)


          c = document.createElement("canvas")
          c.dataset.scaledown = scaledown
          c.setAttribute('width', bbox.width/scaledown)
          c.setAttribute('height', bbox.height/scaledown)
          ctx = c.getContext("2d")
          ctx.drawImage(img, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width/scaledown, bbox.height/scaledown)
          lines[i].parentNode.insertBefore(c, lines[i])
        }

    }


    function onImgLoad(event) {
      console.log('render line images')
      var pages = editor.value.getElementsByClassName("ocr_page")
          console.log(pages)
      for (var i = 0; i < pages.length; i++) {
		    var imgname = titletoimgname(pages[i].title)
        state.page_images.push(imgname)
      }
      addlineimgs(null, page_image.value)
    }

    function onclick(event) {

      if(event.target.classList.contains('ocrx_word')) edit(event.target)
    }

    function edit(ele) {
      var input
      var a
      var c
      var ctx
      var bbox
      var linebox
      var scaledown

      input = document.createElement("input")
      input.className = "editword"
      input.size = 1
      input.value = ele.innerHTML.replace("&amp;", "&")

      // input.addEventListener("input", edited)
      // input.addEventListener("blur", stopedit)
      // input.addEventListener("keydown", keyhandler)
      // input.addEventListener("keyup", selectall)

      // this.removeEventListener("click", edit)

      // if(this.parentNode.parentNode.getElementsByTagName("canvas").length > 0) {
      //   resetlineimg(this.parentNode)
      //   c = this.parentNode.previousSibling
      //   ctx = c.getContext("2d")
      //   linebox = titletobbox(this.parentNode.title)
      //   bbox = titletobbox(this.title)
      //   scaledown = c.dataset.scaledown
      //   ctx.fillStyle = 'rgb(100, 190, 255, 0.5)';
      //   ctx.fillRect((bbox.x - linebox.x)/scaledown, (bbox.y - linebox.y)/scaledown, bbox.width/scaledown, bbox.height/scaledown)
      // }

      ele.innerHTML = ""
      ele.appendChild(input)
      input.focus()
      input.selectionStart = 0
      input.selectionEnd = input.value.length
      input.style.width = (input.value.length * 0.8) + "em"
      if(input.value.length == 1) {
        input.style.width = "2em"
      }
    }

    function titletoimgname(title) {
      var start
      var end
      var path
      var quote

      quote = '"'
      if(title.indexOf(quote) == -1) {
        quote = "'"
      }
      start = title.indexOf('image ' + quote) + ('image ' + quote).length
      end = title.substring(start).indexOf(quote) + start
      if(end > start) {
        path = title.substring(start, end)
      } else {
        path = title.substring(start)
      }

      start = path.lastIndexOf("/") + "/".length

      return path.substring(start)
    }

    function titletobbox(title) {
      var start
      var end
      var fields = []
      var bbox = {}

      const bbfield = {
        "x1": 1,
        "y1": 2,
        "x2": 3,
        "y2": 4,
      }

      start = title.indexOf("bbox")
      end = title.substring(start).indexOf(";") + start
      if(end > start) {
        fields = title.substring(start, end).split(" ")
      } else {
        fields = title.substring(start).split(" ")
      }

      bbox.x = Number(fields[bbfield.x1])
      bbox.y = Number(fields[bbfield.y1])
      bbox.width = fields[bbfield.x2] - fields[bbfield.x1]
      bbox.height = fields[bbfield.y2] - fields[bbfield.y1]

      return bbox
    }



    onMounted(async()=> {
  
      var hocr =  await fetch('/api/files/40:7')
      hocr = await hocr.text();
      var start = hocr.indexOf("<body>") + "<body>".length
      var end = hocr.indexOf("</body>")
      if(start == -1 || end == -1) {
        console.log("Error: failed to find body tag in hocr")
      return
      } 
      hocr = hocr.substring(start, end)
      state.hocr = hocr

      var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        //state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        state.file.original = 'http://localhost:3000/api/files/37:7'

      
    })


    </script>
    
    <style >
    /* Import external CSS files */

    .ocr_line { 
      display: flex; 
      margin-bottom: 2ex;
      margin-top: -8px; 
      justify-content: space-between; 
    }
    .ocr_textfloat { display: block; margin-bottom: 2ex; }
    .selected {background-color: blueviolet;}
    .page_image {width: 100%;}

    @font-face {
  font-family: 'Junicode';
  src: url('@/assets/fonts/junicode.woff') format('woff');
}
.container {
  font-family: 'Junicode', sans-serif; /* Use the Junicode font for this container */
}

  </style>
  