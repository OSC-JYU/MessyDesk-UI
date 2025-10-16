<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: #e57373;
}

.column_text2 {
  height: 100%;
  overflow-y: scroll;
}

.prompt-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prompt-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.section-header h2 {
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.prompt-type-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 8px;
  margin-right: 12px;
}

.add-prompt-card {
  border: 2px dashed #e0e0e0;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgb(176, 196, 208);
}

.add-prompt-card:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
}

.prompt-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;

}

.prompt-description {
  color: #666;
  font-style: italic;
  margin-bottom: 8px;
}

.owner-chip {
  border-radius: 20px;
  font-weight: 500;
}

.main-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.content-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog-card {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.dialog-content {
  padding: 24px;
}

.dialog-actions {
  padding: 16px 24px;
  background: #f8f9fa;
}

.v-card-title {
  overflow: visible !important;
  white-space: normal !important;
  background-color: #81aebf !important;
  color: white !important;
}
</style>

<script setup>
    import JYUHeader_plain from './JYUHeader_plain.vue'
    import web from "../web.js";
    
    import { onMounted, reactive, watch} from "vue";
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

    // Watch for dialog close to reset state
    watch(() => state.show_prompt_dialog, (newVal) => {
      if (!newVal) {
        // Dialog is closing, reset all state
        state.is_editing = false;
        state.edited_prompt = null;
        state.is_new_prompt = false;
        state.new_prompt_type = null;
        state.selected_prompt = null;
      }
    })

    function startEditing() {
      // Reset dialog state first
      state.is_editing = false;
      state.is_new_prompt = false;
      state.new_prompt_type = null;
      state.edited_prompt = null;
      
      // Set up editing
      state.edited_prompt = JSON.parse(JSON.stringify(state.selected_prompt));
      state.is_editing = true;
      state.is_new_prompt = false;
      state.show_prompt_dialog = true;
    }

    function startNewPrompt(type) {
      // Reset all dialog state first
      state.selected_prompt = null;
      state.is_editing = false;
      state.is_new_prompt = false;
      state.new_prompt_type = null;
      state.edited_prompt = null;
      
      // Set up new prompt
      state.new_prompt_type = type;
      state.edited_prompt = {
        type: type,
        name: "",
        description: "",
        content: "",
        output_type: "text",
        json_schema: ""
      };
      state.is_editing = true;
      state.is_new_prompt = true;
      state.show_prompt_dialog = true; 
      state.error_message = null;
    }

    async function savePrompt() {
      state.error_message = null;
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
        state.error_message = error.message;
      }
    }

    function cancelEditing() {
      state.is_editing = false;
      state.edited_prompt = null;
      state.is_new_prompt = false;
      state.new_prompt_type = null;
      state.show_prompt_dialog = false;
      state.selected_prompt = null;
      state.error_message = null;
    
    }

    function closeDialog() {
      state.show_prompt_dialog = false;
      state.is_editing = false;
      state.edited_prompt = null;
      state.is_new_prompt = false;
      state.new_prompt_type = null;
      state.selected_prompt = null;
      state.error_message = null;
    }

</script>



<template>
  <div class="main-container">
    <v-card class="mx-auto fill-height" flat>
      <v-layout class="fill-height">
        <JYUHeader_plain/>

        <v-main class="fill-height">
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters">
              <v-col
                class="d-flex fill-height overflow-auto"
                cols="12"
              >
                <v-container class="py-6">
                  <!-- Header Section -->
                  <div class="section-header">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-lightbulb-on" size="large" class="prompt-type-icon"></v-icon>
                      <div>
                        <h2>AI Prompts Library</h2>
                        <p class="mb-0 mt-2 opacity-90">Reusable templates for defining task content with text, images, or structured JSON output</p>
                      </div>
                    </div>
                  </div>

                  <!-- Image Prompts Section -->
                  <v-card class="content-card pa-6 mb-6">
                    <div class="d-flex align-center mb-6">
                      <div class="prompt-type-icon">
                        <v-icon icon="mdi-image" size="large" color="white"></v-icon>
                      </div>
                      <h2 class="text-h4 mb-0">Image to Text</h2>
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
                          class="prompt-card mx-auto h-100"
                          @click="state.selected_prompt = prompt; state.show_prompt_dialog = true"
                          style="cursor: pointer"
                        >
                          <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon icon="mdi-image" class="mr-2" size="small" color="primary"></v-icon>
                            {{ prompt.name }}
                          </v-card-title>
                          <v-card-subtitle class="prompt-description">{{ prompt.description }}</v-card-subtitle>
                          <v-card-text>
                            <div class="prompt-content">{{ prompt.content }}</div>
                            <v-chip 
                              class="owner-chip mt-2" 
                              size="small" 
                              :color="prompt.output_type === 'json' ? 'warning' : 'success'"
                            >
                              {{ prompt.output_type === 'json' ? 'JSON Output' : 'Text Output' }}
                            </v-chip>
                          </v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="12" sm="6" md="4" lg="3">
                        <v-card
                          class="add-prompt-card mx-auto h-100 d-flex align-center justify-center"
                          @click="startNewPrompt('image')"
                          style="cursor: pointer"
                        >
                          <v-card-text class="text-center">
                            <v-icon icon="mdi-plus" size="large"></v-icon>
                            <div class="text-subtitle-1 mt-2">Add Image Prompt</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card>

                  <!-- Text Prompts Section -->
                  <v-card class="content-card pa-6 mb-6">
                    <div class="d-flex align-center mb-6">
                      <div class="prompt-type-icon">
                        <v-icon icon="mdi-text" size="large" color="white"></v-icon>
                      </div>
                      <h2 class="text-h4 mb-0">Text to Text</h2>
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
                          class="prompt-card mx-auto h-100"
                          @click="state.selected_prompt = prompt; state.show_prompt_dialog = true"
                          style="cursor: pointer"
                        >
                          <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon icon="mdi-text" class="mr-2" size="small" color="primary"></v-icon>
                            {{ prompt.name }}
                          </v-card-title>
                          <v-card-subtitle class="prompt-description">{{ prompt.description }}</v-card-subtitle>
                          <v-card-text>
                            <div class="prompt-content">{{ prompt.content }}</div>
                            <v-chip 
                              class="owner-chip mt-2" 
                              size="small" 
                               :color="prompt.output_type === 'json' ? 'warning' : 'success'"
                            >
                              {{ prompt.output_type === 'json' ? 'JSON Output' : 'Text Output' }}
                            </v-chip>
                          </v-card-text>
                      

                        </v-card>
                      </v-col>
                      <v-col cols="12" sm="6" md="4" lg="3">
                        <v-card
                          class="add-prompt-card mx-auto h-100 d-flex align-center justify-center"
                          @click="startNewPrompt('text')"
                          style="cursor: pointer"
                        >
                          <v-card-text class="text-center">
                            <v-icon icon="mdi-plus" size="large"></v-icon>
                            <div class="text-subtitle-1 mt-2">Add Text Prompt</div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card>

             
                </v-container>
              </v-col>
            </v-row>
          </v-container>
        </v-main>
      </v-layout>

      <!-- Prompt Details Dialog -->
      <v-dialog v-model="state.show_prompt_dialog" max-width="900px">
        <v-card v-if="state.edited_prompt || state.selected_prompt" class="dialog-card">
          <div class="dialog-title">
            <div class="d-flex align-center">
              <v-icon 
                :icon="state.is_new_prompt ? 
                  (state.new_prompt_type === 'image' ? 'mdi-image' : 
                   state.new_prompt_type === 'text' ? 'mdi-text' : 'mdi-code-json') : 
                  (state.selected_prompt.type === 'image' ? 'mdi-image' : 
                   state.selected_prompt.type === 'text' ? 'mdi-text' : 'mdi-code-json')" 
                class="mr-3" 
                size="large"
              ></v-icon>
              <div class="flex-grow-1">
                <template v-if="state.is_editing">
                  <v-text-field
                    v-model="state.edited_prompt.name"
                    density="compact"
                    hide-details
                    placeholder="Enter prompt name"
                    variant="solo-filled"

                  ></v-text-field>
                </template>
                <template v-else>
                  <h3 class="text-h5 mb-0">{{ state.selected_prompt.name }}</h3>
                </template>
              </div>
              <v-chip 
                v-if="!state.is_new_prompt" 
                class="ml-2" 
                size="small" 
                :color="state.selected_prompt.owner === 'public' ? 'success' : 'primary'"
              >
                {{ state.selected_prompt.owner }}
              </v-chip>
            </div>
          </div>
          
          <div class="dialog-content">
            <div class="mb-6">
              <div class="text-subtitle-1 mb-3 font-weight-bold">
                <v-icon :icon="state.is_new_prompt ? 
                  (state.new_prompt_type === 'image' ? 'mdi-image' : 
                   state.new_prompt_type === 'text' ? 'mdi-text' : 'mdi-code-json') : 
                  (state.selected_prompt.type === 'image' ? 'mdi-image' : 
                   state.selected_prompt.type === 'text' ? 'mdi-text' : 'mdi-code-json')" 
                  class="mr-2" 
                  size="small"
                ></v-icon>
                Prompt Content:
              </div>
              <template v-if="state.is_editing">
                <v-textarea
                  v-model="state.edited_prompt.content"
                  class="mb-4"
                  rows="6"
                  auto-grow
                  placeholder="Enter prompt content"
                  variant="outlined"
                ></v-textarea>
              </template>
              <template v-else>
                <div class="prompt-content mb-4">{{ state.selected_prompt.content }}</div>
              </template>
            </div>

            <div class="mb-6">
              <div class="text-subtitle-1 mb-3 font-weight-bold">
                <v-icon icon="mdi-information" class="mr-2" size="small"></v-icon>
                Description:
              </div>
              <template v-if="state.is_editing">
                <v-textarea
                  v-model="state.edited_prompt.description"
                  class="mb-4"
                  rows="3"
                  auto-grow
                  placeholder="Enter prompt description"
                  variant="outlined"
                ></v-textarea>
              </template>
              <template v-else>
                <div class="prompt-description mb-4">{{ state.selected_prompt.description }}</div>
              </template>
            </div>



            <!-- Output Type Selector -->
            <div class="mb-6">

              <template v-if="state.is_editing">
                <v-checkbox
                  v-model="state.edited_prompt.output_type"
                  true-value="json"
                  false-value="text"
                  color="purple"
                  hide-details
                >
                  <template v-slot:label>
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-code-json" class="mr-2" size="small" color="purple"></v-icon>
                      <span class="font-weight-medium">JSON Output</span>
                    </div>
                  </template>
                </v-checkbox>
              </template>
              <template v-else>
                <div class="d-flex align-center">
                  <v-icon 
                    :icon="state.selected_prompt.output_type === 'json' ? 'mdi-code-json' : 'mdi-format-text'" 
                    class="mr-2" 
                    size="small"
                    :color="state.selected_prompt.output_type === 'json' ? 'purple' : 'primary'"
                  ></v-icon>
                  <v-chip 
                    :color="state.selected_prompt.output_type === 'json' ? 'purple' : 'primary'"
                    class="owner-chip"
                  >
                    {{ state.selected_prompt.output_type === 'json' ? 'JSON Output' : 'Text Output' }}
                  </v-chip>
                </div>
              </template>

            <!-- JSON Schema Section -->
                             <!-- JSON Output Explanation -->

                             <div class="mb-6" v-if="(state.is_editing && state.edited_prompt.output_type === 'json') || (!state.is_editing && state.selected_prompt.output_type === 'json')">
              <v-alert
                 
                 type="info"
                 variant="tonal"
                 class="mt-3"
                 density="compact"
               >
                 <div class="text-subtitle-2 mb-2">
                  
                   JSON Output 
                 </div>
                 <div class="text-body-2">
                   When set to JSON output, the AI model will be instructed to return structured data in JSON format. 
                   This is useful for extracting specific information or creating structured responses that can be easily parsed by other systems.<br>format example:
                   <pre class="prompt-content">{
  "books":[{"title":"String","year":"Integer","authors":["String"]}]
}</pre>
                   <br><b>NOTE: Not all models support JSON output.</b></br>
                 </div>
               </v-alert>
              <div class="text-subtitle-1 mb-3 font-weight-bold">
                <v-icon icon="mdi-code-json" class="mr-2" size="small"></v-icon>
                JSON Schema (Optional)
              </div>
              <template v-if="state.is_editing">
                <v-textarea
                  v-model="state.edited_prompt.json_schema"
                  class="mb-4"
                  rows="6"
                  auto-grow
                  placeholder="Enter JSON schema to guide the AI output structure, e.g.:&#10;{&#10;  'title': 'string',&#10;  'description': 'string',&#10;  'tags': ['array of strings']&#10;}"
                  variant="outlined"
                ></v-textarea>

              </template>
              <template v-else>
                <div class="prompt-content mb-4" v-if="state.selected_prompt.json_schema">
                  {{ state.selected_prompt.json_schema }}
                </div>
                <div v-else class="text-grey-500 italic">
                  No JSON schema defined
                </div>
              </template>
            </div>


            </div>
          </div>
          
          <div class="dialog-actions">
            <v-spacer></v-spacer>
            <template v-if="state.is_editing">
              <v-alert v-if="state.error_message" type="error" variant="tonal" class="mb-2">
                {{ state.error_message }}
              </v-alert>
              <v-btn color="error" variant="outlined" @click="cancelEditing" class="mr-2">
                <v-icon icon="mdi-close" class="mr-1"></v-icon>
                Cancel
              </v-btn>
              <v-btn 
                color="primary" 
                variant="elevated" 
                @click="savePrompt"
                :disabled="!state.edited_prompt.name || !state.edited_prompt.content || (state.edited_prompt.output_type === 'json' && !state.edited_prompt.json_schema)"
              >
                <v-icon icon="mdi-content-save" class="mr-1"></v-icon>
                Save
              </v-btn>
            </template>
            <template v-else>
              <v-btn 
                v-if="state.selected_prompt.owner !== 'public'"
                color="primary" 
                variant="outlined" 
                @click="startEditing"
                class="mr-2"
              >
                <v-icon icon="mdi-pencil" class="mr-1"></v-icon>
                Edit
              </v-btn>
              <v-btn color="primary" variant="elevated" @click="closeDialog">
                <v-icon icon="mdi-check" class="mr-1"></v-icon>
                Close
              </v-btn>
            </template>
          </div>
        </v-card>
      </v-dialog>
    </v-card>
  </div>
</template>


