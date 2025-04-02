<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

  .column_text2 {
  height: 100%;
  overflow-y: scroll;
}

.v-card-title {
  overflow: visible !important;
  white-space: normal !important;
  background-color: #81aebf  !important;
  color: white !important;
}

</style>

<script setup>
    import JYUHeader_plain from './JYUHeader_plain.vue'
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";
    import { useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - prompts"


    var state = reactive({
        search: "",
        result: [],
        prompts: [],
        tasks: [],
        add: false,
        new_name: "",
        new_email: "",
        tab: 0,
        sortBy: 'active',
        show_my_prompts: true,
        show_public_prompts: true,
        selected_prompt: null,
        show_prompt_dialog: false,
        is_editing: false,
        edited_prompt: null,
        is_new_prompt: false,
        new_prompt_type: null,

        headers: [
            {
                title: 'Task',
                key: 'name', 
                sortable: true
            },
            {
                title: 'Description',
                key: 'description', 
                sortable: true
            },
            {
                title: 'Service',
                key: 'service', 
                sortable: true
            },
            {
                title: 'Media',
                key: 'supported_types', 
                sortable: true
            },
            {
                title: 'Access',
                key: 'access', 
                sortable: true
            }
        ]
    })


    onMounted(async()=> {
      var response = await web.getPrompts()
      state.prompts = response
    })

    function startEditing() {
      state.edited_prompt = JSON.parse(JSON.stringify(state.selected_prompt));
      state.is_editing = true;
      state.is_new_prompt = false;
    }

    function startNewPrompt(type) {
      state.new_prompt_type = type;
      state.edited_prompt = {
        type: type,
        name: "",
        description: "",
        content: ""
      };
      state.is_editing = true;
      state.is_new_prompt = true;
      state.show_prompt_dialog = true;
    }

    async function savePrompt() {
      try {
        if (state.is_new_prompt) {
          await web.savePrompt(state.edited_prompt);
          // Add the new prompt to the list
          state.prompts.push(state.edited_prompt);
        } else {
          await web.savePrompt(state.edited_prompt);
          // Update the prompt in the list
          const index = state.prompts.findIndex(p => p['@rid'] === state.edited_prompt['@rid']);
          if (index !== -1) {
            state.prompts[index] = state.edited_prompt;
          }
        }
        state.selected_prompt = state.edited_prompt;
        state.is_editing = false;
        state.is_new_prompt = false;
      } catch (error) {
        console.error('Failed to save prompt:', error);
      }
    }

    function cancelEditing() {
      state.is_editing = false;
      state.edited_prompt = null;
      state.is_new_prompt = false;
      state.new_prompt_type = null;
    }

</script>



<template>

<v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
    <v-layout class="fill-height">

      <JYUHeader_plain/>

      <v-main class="fill-height">
        <v-container class="fill-height pa-0" fluid>




          <v-row class="fill-height no-gutters" >

         


            <v-col
              class="d-flex fill-height overflow-auto"
              cols="12"
              color="light-blue lighten-3"
            >
              <v-container>
                <v-alert
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  <div class="text-subtitle-1 mb-2">About Prompts</div>
                  <div>Prompts are reusable templates that can be used to define the content of a task with your own text or images. Create your own prompts or use public ones.</div>
                </v-alert>

                <v-sheet class="pa-4">
                  <div class="d-flex align-center mb-4">
                    <v-icon icon="mdi-image" class="mr-2" color="primary"></v-icon>
                    <h2 class="text-h5 mb-0">Image Prompts</h2>
                  </div>
                  <v-row dense>
                    <v-col
                      v-for="(prompt, i) in state.prompts.filter(p => p.type === 'image')"  
                      :key="prompt['@rid']"
                      cols="12"
                      sm="6"
                      md="4"
                      lg="3"
                    >
                      <v-card
                        variant="outlined"
                        class="mx-auto h-100"
                        color="surface-variant"
                        @click="state.selected_prompt = prompt; state.show_prompt_dialog = true"
                        style="cursor: pointer"
                      >
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                          <v-icon icon="mdi-image" class="mr-2" size="small"></v-icon>
                          {{ prompt.name }}

                        </v-card-title>
                        <v-card-subtitle class="text-truncate">{{ prompt.description }}</v-card-subtitle>
                        <v-card-text class="text-truncate">{{ prompt.content }}</v-card-text>
                        <v-chip 
                            class="ml-2" 
                            size="small" 
                            :color="prompt.owner === 'public' ? 'success' : 'primary'"
                          >
                            {{ prompt.owner }}
                          </v-chip>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn 
                            v-if="prompt.owner !== 'public'"
                            icon="mdi-pencil"
                            size="small"
                            variant="text"
                            @click.stop="state.selected_prompt = prompt; startEditing()"
                          ></v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="4" lg="3">
                      <v-card
                        variant="outlined"
                        class="mx-auto h-100 d-flex align-center justify-center"
                        color="surface-variant"
                        @click="startNewPrompt('image')"
                        style="cursor: pointer"
                      >
                        <v-card-text class="text-center">
                          <v-icon icon="mdi-plus" size="large" color="primary"></v-icon>
                          <div class="text-subtitle-1 mt-2">Add Image Prompt</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-sheet>

                <v-divider class="my-4"></v-divider>

                <v-sheet class="pa-4">
                  <div class="d-flex align-center mb-4">
                    <v-icon icon="mdi-text" class="mr-2" color="primary"></v-icon>
                    <h2 class="text-h5 mb-0">Text Prompts</h2>
                  </div>
                  <v-row dense>
                    <v-col
                      v-for="(prompt, i) in state.prompts.filter(p => p.type === 'text')"  
                      :key="prompt['@rid']"
                      cols="12"
                      sm="6"
                      md="4"
                      lg="3"
                    >
                      <v-card
                        variant="outlined"
                        class="mx-auto h-100"
                        color="surface-variant"
                        @click="state.selected_prompt = prompt; state.show_prompt_dialog = true"
                        style="cursor: pointer"
                      >
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                          <v-icon icon="mdi-text" class="mr-2" size="small"></v-icon>
                          {{ prompt.name }}

                        </v-card-title>
                        <v-card-subtitle class="text-truncate">{{ prompt.description }}</v-card-subtitle>
                        <v-card-text class="text-truncate">{{ prompt.content }}</v-card-text>
                        <v-chip 
                            class="ml-2" 
                            size="small" 
                            :color="prompt.owner === 'public' ? 'success' : 'primary'"
                          >
                            {{ prompt.owner }}
                          </v-chip>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn 
                            v-if="prompt.owner !== 'public'"
                            icon="mdi-pencil"
                            size="small"
                            variant="text"
                            @click.stop="state.selected_prompt = prompt; startEditing()"
                          ></v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="4" lg="3">
                      <v-card
                        variant="outlined"
                        class="mx-auto h-100 d-flex align-center justify-center"
                        color="surface-variant"
                        @click="startNewPrompt('text')"
                        style="cursor: pointer"
                      >
                        <v-card-text class="text-center">
                          <v-icon icon="mdi-plus" size="large" color="primary"></v-icon>
                          <div class="text-subtitle-1 mt-2">Add Text Prompt</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-sheet>


              
              </v-container>
            </v-col>

          </v-row>
        </v-container>
      </v-main>
    </v-layout>

    <!-- Prompt Details Dialog -->
    <v-dialog v-model="state.show_prompt_dialog" max-width="800px">
      <v-card v-if="state.edited_prompt || state.selected_prompt">
        <v-card-title class="text-h5 d-flex align-center">
          <template v-if="state.is_editing">
            <v-text-field
              v-model="state.edited_prompt.name"
              class="mr-4"
              density="compact"
              hide-details
              placeholder="Enter prompt name"
            ></v-text-field>
          </template>
          <template v-else>
            {{ state.selected_prompt.name }}
          </template>
          <v-chip 
            v-if="!state.is_new_prompt" 
            class="ml-2" 
            size="small" 
            :color="state.selected_prompt.owner === 'public' ? 'success' : 'primary'"
          >
            {{ state.selected_prompt.owner }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <div class="text-subtitle-1 mb-2">Description:</div>
          <template v-if="state.is_editing">
            <v-textarea
              v-model="state.edited_prompt.description"
              class="mb-4"
              rows="3"
              auto-grow
              placeholder="Enter prompt description"
            ></v-textarea>
          </template>
          <template v-else>
            <div class="mb-4">{{ state.selected_prompt.description }}</div>
          </template>
          
          <div class="text-subtitle-1 mb-2">Content:</div>
          <template v-if="state.is_editing">
            <v-textarea
              v-model="state.edited_prompt.content"
              class="mb-4"
              rows="5"
              auto-grow
              placeholder="Enter prompt content"
            ></v-textarea>
          </template>
          <template v-else>
            <div class="mb-4">{{ state.selected_prompt.content }}</div>
          </template>
          
          <div class="text-subtitle-1 mb-2">Type:</div>
          <div class="mb-4">{{ state.is_new_prompt ? state.new_prompt_type : state.selected_prompt.type }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <template v-if="state.is_editing">
            <v-btn color="error" variant="text" @click="cancelEditing" class="mr-2">
              Cancel
            </v-btn>
            <v-btn 
              color="primary" 
              variant="text" 
              @click="savePrompt"
              :disabled="!state.edited_prompt.name || !state.edited_prompt.content"
            >
              Save
            </v-btn>
          </template>
          <template v-else>
            <v-btn 
              v-if="state.selected_prompt.owner !== 'public'"
              color="primary" 
              variant="text" 
              @click="startEditing"
              class="mr-2"
            >
              Edit
            </v-btn>
            <v-btn color="primary" variant="text" @click="state.show_prompt_dialog = false">
              Close
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>  


 
  </template>


