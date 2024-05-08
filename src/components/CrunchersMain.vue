
<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
 	import JYUHeader from './JYUHeader.vue'
 	import CruncherList from './CruncherList.vue'
	import NodeCard from './NodeCard.vue'
    import ProcessCreator from './ProcessCreator.vue'

	document.title = "Crunchers aka processing tools"

    const route  = useRoute();
    const router = useRouter();

  

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
                        <div id="container" >
                            <div class="row h-100" >
                                <div class="col-9 px-0 " >
                                   
                                    <ProcessCreator />
                                    <CruncherList />
                                  
                                </div>

                                <div class="col-3 sidebar p-0 h-100">
                                
                                    <NodeCard class="h-100 w-100 position-absolute"/>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
