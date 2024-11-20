

<template>
 

 <div id="container" >
		<div class="row h-100" >
            <div class="sidebar p-0 h-100" >

                <v-list-item
                    v-for="file in store.root_nodes"
                    :key="file.id"
                    :subtitle="file.type"
                    :title="file.data.label"
                    @click="$emit('fitToNode', file.id)"
                >
                    <template v-slot:prepend>
                    <v-avatar :color="file.color">
                        <v-icon color="white">{{ file.icon }}</v-icon>
                    </v-avatar>
                    </template>

                    <template v-slot:append>
                    <v-btn
                        color="grey-lighten-1"
                        icon="mdi-information"
                        variant="text"
                    ></v-btn>
                    </template>
                </v-list-item>

            </div>
		</div>
    </div>

  
</template>


<script setup>


    import {store} from "./Store.js";


</script>
