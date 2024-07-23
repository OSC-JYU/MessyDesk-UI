<script setup>
    import JYUHeader from './JYUHeader.vue'
    import ImageDisplay from './displays/ImageDisplay.vue'
    import HOCRDisplay from './displays/HOCRDisplay.vue'
    import web from "../web.js";
    
    import nodes from "@/assets/images/nodes.jpg"
    import system from "@/assets/images/system.jpg"
    import blue from "@/assets/images/blue.png"

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - files"


    var state = reactive({
        slides: [
            {
                title: '1. What is MessyDesk?', 
                text: 'Two functions of MessyDesk', 
                image: nodes,
                list:[
                    {
                        title: 'Open playground for digital humanities', 
                        subtitle:'Try easily, fail early',
                        text:` You don't have to setup any tools. Just upload your files and get started. `,
                    },
                    {
                        title: 'Pre-research tools for file processing', 
                        subtitle:'Do your research, not things that can be automated',
                        text: `Auto-rotate your text scans, scale images, do OCR,etc.`
                    }
                ] 
            },

            {
                title: '2. Design', 
                text: 'Two challenges of MessyDesk', 

                list:[
                    {
                        title: 'User interface design', 
                        subtitle:'How to support chains of operations? <br>How to allow testing with different parameters?',
                        text:``,
                        image: blue
                    },
                    {
                        title: 'Service architecture design', 
                        subtitle:'How to combine separate tools to an uniform interface',
                        text: ``,
                        image: blue
                    }
                ] 
            },

            {
                title: '3. User interface', 
                text: 'Nodes to rescue', 
                image: nodes,
                list:[
                    {
                        title: 'History view', 
                        subtitle:'Non-scary node view',
                        text:`<p>Node-base UI is able to show complex workflows. However, it can be scary and indeed, it can be annoying.</p> <p>In order to avoid this Messydesk uses nodes for showing the <b>history of files</b>.</p>`,
                    },
                    {
                        title: 'Service architecture', 
                        subtitle:'How to combine separate tools to an uniform interface?',
                        text: ``,
                        image: blue
                    }
                ] 
            },
        ]
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
                    <div class="row mt-2 p-0  fill-height h-100">
                        <v-carousel class="fill-height"
                            show-arrows="hover"
                        >

                            <v-carousel-item
                            v-for="(slide, i) in state.slides"
                            :key="i"
                            >
                                <v-sheet
                                    color="indig"
                                    height="100%"
                                >
                                    <v-img max-height="400px" :src="slide.image"></v-img>

                                    <div class="d-flex  justify-center align-center">
                                        <div class="text-h3">
                                            {{ slide.title }} 
                                        </div>
                                    </div>
                                    <div class="d-flex  justify-center align-center">

                                        <div class="m-4 text">{{ slide.text }}</div>
                                    </div>

                                    <v-row class="d-flex justify-center align-center ">
                                        <v-col cols="12" md="6" v-for="item in slide.list">

                                            <v-card  class="m-4" max-width="544" :title="item.title" :subtitle="item.subtitle">
                                                <template v-slot:subtitle>
                                                    <div v-html="item.subtitle"></div>
                                                </template>
                                                <template v-slot:text>
                                                    <div v-html="item.text"></div>
                                                </template>
                                                <!-- <template v-slot:image> -->
                                                    <v-img :src="item.image"></v-img>
                                                <!-- </template> -->
                                            </v-card>
                                        </v-col>
                                    </v-row>

                                </v-sheet>
                            </v-carousel-item>
                        </v-carousel>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

