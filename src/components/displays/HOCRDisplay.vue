<template>
  <v-container>
    <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',0)"
      ></v-btn>
      <v-row class="m-2">

        <v-col cols="col-6">
          <v-card class="overflow-auto" height="90dvh">
            <v-card-text>
              
                <img ref="page_image" class="page_image" @load="onImgLoad" v-if="state.file" :src="state.file.original" alt="Image" />
                {{ state.page_images }}

              
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="col-6">
          <v-card class="overflow-auto" height="100dvh">
            <v-card-text>
              <div ref="editor" @click="onclick" v-html="state.hocr"></div>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>
  </v-container>
</template>
  
  <script setup>

    // heavily based on: https://github.com/rescribe/proofreader

    import { ref, onMounted, reactive, watch } from 'vue';
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";
    const apiUrl = import.meta.env.VITE_API_PATH;

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

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

    async function load() {
      var hocr =  await fetch(apiUrl + '/api/files/' + store.file['@rid'].replace('#', ''))
      hocr = await hocr.text();
      var start = hocr.indexOf("<body>") + "<body>".length
      var end = hocr.indexOf("</body>")
      if(start == -1 || end == -1) {
        console.log("Error: failed to find body tag in hocr")
      return
      } 
      hocr = hocr.substring(start, end)
      state.hocr = hocr

      var response = await web.getDocInfo(store.file['@rid'])
        
        state.file = response
        //state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        state.file.original = 'http://localhost:3000/api/files/' + store.source.replace('#', '')
    }

    onMounted(async()=> {
      await load()
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

.v-container {
  max-width: 1600px;
  margin-left:100px;
}

  </style>
  