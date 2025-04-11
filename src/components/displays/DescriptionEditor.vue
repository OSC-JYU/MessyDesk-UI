<template>

        <!-- DESCRIPTION -->
         
        <div v-if="empty(props.description) && empty(state.modified_description)" @click="editDescription()" class="text-medium-emphasis">add description</div>
        <div v-if="state.edit_description_open == false" @click="editDescription()">
          <template v-if="state.modified_description != ''"><pre>{{state.modified_description }}</pre>
          </template>
          <template v-else><pre>{{props.description }}</pre>
          </template>
        </div>
        
        <v-card v-else class="pa-6"> 
            <v-textarea 
            label="Description"
            v-model="state.edit_description"
            name="input-7-1"
            variant="filled"
            auto-grow
            ></v-textarea>
            <v-card-actions>
                <v-btn @click="closeDescription()">Cancel</v-btn>
                <v-btn @click="saveDescription()">Save</v-btn>
            </v-card-actions>
        
        </v-card>

    
  </template>
  
  <script setup>

    import { reactive, watch } from "vue";
    import web from "../../web.js";

    // declare props description
    const props = defineProps({
        description: {
            type: String,
            required: false,
            default: ''
        },
        rid: {
            type: String,
            required: true
        }
    })

    watch(
        () => props.rid,
        () => {
          console.log('updated description')
            state.modified_description = props.description
        }
    )

    var state = reactive({
        file: null,
        edit_description_open: false,
        edit_description: '',
        modified_description: ''
    })

    function editDescription() {
      if(state.modified_description != '') {
        state.edit_description = state.modified_description
      } else {
        state.edit_description = props.description
      }
        state.edit_description_open = true
    }

    function closeDescription() {
        state.edit_description = ''
        state.edit_description_open = false
    }

    function saveDescription() {
        web.setNodeAttribute(props.rid, {key:'description', value: state.edit_description})
        state.modified_description = state.edit_description
        state.edit_description = ''
        state.edit_description_open = false
    }

    function empty(string) {
        return (!string || string.trim().length === 0 );
    }


  </script>
  
