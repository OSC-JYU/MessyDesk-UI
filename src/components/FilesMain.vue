<script setup>
    import JYUHeader from './JYUHeader.vue'
    import ImageDisplay from './displays/ImageDisplay.vue'
    import HOCRDisplay from './displays/HOCRDisplay.vue'
    import NER_Display from './displays/NER_Display.vue'
    import TextDisplay from './displays/TextDisplay.vue'
    import PDFDisplay from './displays/PDFDisplay.vue'
    import web from "../web.js";
    
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - files"


    var state = reactive({
        file: null
    })

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        console.log(state.file)
        state.file.thumbnail = removeLastPathPart(response.path.replace('data/', '/api/thumbnails/'))
        document.title = state.file.label
    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }


</script>



<template>
    <div class="vh-100 container-fluid m-0 p-0">
        <div class="row  h-100  w-100 m-0 p-0">
            <div class="col-12 m-0 p-0">
                <div class="h-100 d-flex flex-column w-100 m-0 p-0">
                    <div class="row justify-content-center m-0 p-0">
                        <JYUHeader/>
                    </div>
                    <div class="row m-0 p-0  flex-grow-1">
                        <ImageDisplay v-if="state.file  && state.file.type=='image'"/>
                        <TextDisplay v-if="state.file  && state.file.type=='text'"/>
                        <PDFDisplay v-if="state.file  && state.file.type=='pdf'"/>
                        <HOCRDisplay v-if="state.file && state.file.extension=='hocr'"/>
                        <NER_Display v-if="state.file && state.file.extension=='json' && state.file.label.includes('.ner.json')"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

