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
          <div v-html="state.text"></div>
        </v-col>

        <v-col cols="3">
          <template v-if="state.cruncher">
            <v-card>
                <v-card-title>{{ state.cruncher.label }}</v-card-title>
                <v-card-text>{{ state.cruncher.info }}</v-card-text>
            </v-card>
          </template>
        </v-col>  

      </v-row>
    </v-container>

    
  </template>
  
  <script setup>

    import { onMounted, watch, reactive} from "vue";
  
    import web from "../../web.js";

    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

    var state = reactive({
        file: null,
        cruncher: null
    })

    async function load() {
      var response = await web.getDocInfo(route.params.rid)
      var f = await web.getNodeFile(route.params.rid)
      state.file = response
      console.log(f)
      state.text = replaceWithBr(JSON.stringify(f, null, 2))
      if(route.query.cruncher) {
        var response2 = await web.getDocInfo(route.query.cruncher)
        state.cruncher = response2
      }
    }

    onMounted(async()=> {
      await load()
    })

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }

  </script>
  
  <style scoped>

  </style>