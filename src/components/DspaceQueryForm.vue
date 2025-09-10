<!--
  DSpace Query Form Component
  
  A minimal, compact form component for building DSpace queries that can be integrated
  into the cruncher list view or used independently.
  
  Props:
  - dspaceUrl: The DSpace REST API URL
  - initData: Object containing collections hierarchy and available metadata fields
  
  Events:
  - query-executed: Emitted when search button is clicked with query data
  
  Usage in CruncherList:
  <DspaceQueryForm 
    :dspace-url="service.dspace_url"
    :init-data="service.init_data"
    @query-executed="handleDspaceQuery"
  />
-->

<template>
  <div class="dspace-query-form-compact">
    <div class="form-header">
      <v-icon icon="mdi-database-search" size="small" class="mr-2"></v-icon>
      <span class="text-subtitle-2">DSpace Query</span>
    </div>
    
    <div class="form-content">
      <!-- Collection Selection -->
      <div class="mb-2">
        <v-label class="text-caption text-medium-emphasis mb-2 d-block">Collections</v-label>
        <v-menu>
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="collection-selector">
              <div v-if="selectedCollections.length === 0" class="placeholder-text">
                Select collections...
              </div>
              <div v-else class="chips-container">
                <v-chip
                  v-for="collectionId in selectedCollections"
                  :key="collectionId"
                  size="small"
                  variant="tonal"
                  closable
                  @click:close="toggleCollection(collectionId)"
                  class="mr-1 mb-1"
                >
                  {{ getCollectionName(collectionId) }}
                </v-chip>
              </div>
              <v-icon icon="mdi-chevron-down" size="small" class="dropdown-icon"></v-icon>
            </div>
          </template>
          <v-card min-width="300" max-height="400">
            <v-card-text class="pa-2">
              <div v-for="community in hierarchy" :key="community.id" class="mb-3">
                <v-checkbox
                  :label="community.name"
                  :model-value="isCommunitySelected(community.id)"
                  @update:model-value="toggleCommunity(community.id)"
                  :indeterminate="isCommunityIndeterminate(community.id)"
                  density="compact"
                  hide-details
                  class="font-weight-bold text-primary"
                />
                <div class="ml-4">
                  <v-checkbox
                    v-for="collection in community.collections"
                    :key="collection.id"
                    :label="collection.name"
                    :model-value="selectedCollections.includes(collection.id)"
                    @update:model-value="toggleCollection(collection.id)"
                    density="compact"
                    hide-details
                    class="mb-1"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>

      <!-- Search Criteria -->
      <div class="mb-2">
        <v-label class="text-caption text-medium-emphasis mb-2 d-block">Search Criteria</v-label>
        
        <!-- Add Search Criteria Button -->
        <v-btn
          @click="addSearchCriteria"
          size="small"
          variant="outlined"
          prepend-icon="mdi-plus"
          class="mb-3"
        >
          Add Field Search
        </v-btn>

        <!-- Search Criteria List -->
        <div v-for="(criteria, index) in searchCriteria" :key="index" class="search-criteria-item mb-3">
          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center mb-2">
              <span class="text-caption text-medium-emphasis">Search {{ index + 1 }}</span>
              <v-spacer></v-spacer>
              <v-btn
                @click="removeSearchCriteria(index)"
                size="x-small"
                variant="text"
                icon="mdi-close"
                color="error"
              ></v-btn>
            </div>
            
            <div class="d-flex gap-2 align-center">
              <!-- Field Selection -->
              <v-select
                v-model="criteria.fieldId"
                :items="availableFields"
                item-title="name"
                item-value="id"
                label="Field"
                variant="outlined"
                density="compact"
                hide-details
                style="min-width: 200px;"
                
              />
              
              <!-- Match Type -->
              <v-select
                v-model="criteria.matchType"
                :items="matchTypes"
                label="Match"
                variant="outlined"
                density="compact"
                hide-details
                style="min-width: 120px;"
                
              />
              
              <!-- Search Value -->
              <v-text-field
                v-model="criteria.value"
                label="Value"
                placeholder="Enter search value..."
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1;"
              
              />
            </div>
          </v-card>
        </div>

        <!-- General Query Text -->
        <v-text-field
          v-model="queryText"
          label="General Query (optional)"
          placeholder="Additional search terms (supports AND, OR, NOT, quotes for phrases)..."
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
          
        />
        
        <!-- Query Preview -->
        <div v-if="generatedQuery" class="query-preview mb-2">
          <v-label class="text-caption text-medium-emphasis mb-1 d-block">Generated Solr Query:</v-label>
          <v-card variant="outlined" class="pa-2">
            <code class="text-caption">{{ generatedQuery }}</code>
          </v-card>
        </div>
      </div>

      <!-- Search Button -->
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        block
        @click="executeQuery"
        class="mt-1"
      >
        <v-icon start icon="mdi-magnify" size="small"></v-icon>
        Search
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import web from '../web'

const props = defineProps({
  dspaceUrl: {
    type: String,
    required: true
  },
  sourceRid: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['query-executed'])

// Reactive state
const selectedCollections = ref([])
const queryText = ref('')
const availableCollections = ref([])
const availableFields = ref([])
const hierarchy = ref([])
const searchCriteria = ref([])

// Match types for search criteria
const matchTypes = [
  { title: 'Includes', value: 'includes' },
  { title: 'Exact Match', value: 'exact' },
  { title: 'Wildcard (starts with)', value: 'wildcard_start' },
  { title: 'Wildcard (ends with)', value: 'wildcard_end' },
  { title: 'Wildcard (contains)', value: 'wildcard_contains' }
]

const generatedQuery = computed(() => {
  const queryParts = []
  
  // Add field-specific search criteria
  const validCriteria = searchCriteria.value.filter(c => c.fieldId && c.value.trim())
  validCriteria.forEach(criteria => {
    const fieldName = getFieldName(criteria.fieldId)
    if (fieldName) {
      let value = criteria.value.trim()
      
      // Apply match type based on DSpace 7 Solr syntax
      switch (criteria.matchType) {
        case 'exact':
          value = `"${value}"`
          break
        case 'wildcard_start':
          value = `${value}*`
          break
        case 'wildcard_end':
          value = `*${value}`
          break
        case 'wildcard_contains':
          value = `*${value}*`
          break
        case 'includes':
        default:
          // For includes, only quote if it contains special characters or spaces
          if (needsQuotes(value)) {
            value = `"${value}"`
          }
          break
      }
      
      queryParts.push(`${fieldName}:${value}`)
    }
  })
  
  // Add general query
  const generalQuery = queryText.value.trim()
  if (generalQuery) {
    queryParts.push(generalQuery)
  }
  
  return queryParts.length > 0 ? queryParts.join(' AND ') : ''
})



// Methods
const loadInitData = async () => {
  const initData = await web.getSourceInit(props.sourceRid)
  if (initData.hierarchy) {
    // Store the hierarchy for the grouped display
    hierarchy.value = initData.hierarchy
    
    // Also keep the flattened collections for backward compatibility
    const collections = []
    initData.hierarchy.forEach(community => {
      community.collections.forEach(collection => {
        collections.push({
          ...collection,
          communityName: community.name
        })
      })
    })
    availableCollections.value = collections
  }
  
  if (initData.fields) {
    availableFields.value = initData.fields
  }
}

const executeQuery = () => {
  const validCriteria = searchCriteria.value.filter(c => c.fieldId && c.value.trim())
  const generalQuery = queryText.value.trim()
  
  const query = {
    collections: selectedCollections.value,
    searchCriteria: validCriteria,
    generalQuery: generalQuery,
    solrQuery: generatedQuery.value,
    timestamp: new Date().toISOString()
  }
  
  emit('query-executed', query)
}

// Helper function to get field name from field ID
const getFieldName = (fieldId) => {
  const field = availableFields.value.find(f => f.id === fieldId)
  return field ? field.name : null
}

// Helper function to check if value needs quotes
const needsQuotes = (value) => {
  // Check for special characters that need quoting
  const specialChars = /[:*+\-&|!(){}[\]^"~?\\]/
  return specialChars.test(value) || value.includes(' ')
}

// Search criteria management
const addSearchCriteria = () => {
  searchCriteria.value.push({
    fieldId: null,
    matchType: 'includes',
    value: ''
  })
}

const removeSearchCriteria = (index) => {
  searchCriteria.value.splice(index, 1)
}

// Helper methods for community selection
const isCommunitySelected = (communityId) => {
  const community = hierarchy.value.find(c => c.id === communityId)
  if (!community) return false
  return community.collections.every(collection => 
    selectedCollections.value.includes(collection.id)
  )
}

const isCommunityIndeterminate = (communityId) => {
  const community = hierarchy.value.find(c => c.id === communityId)
  if (!community) return false
  const selectedCount = community.collections.filter(collection => 
    selectedCollections.value.includes(collection.id)
  ).length
  return selectedCount > 0 && selectedCount < community.collections.length
}

const toggleCommunity = (communityId) => {
  const community = hierarchy.value.find(c => c.id === communityId)
  if (!community) return
  
  const isSelected = isCommunitySelected(communityId)
  const collectionIds = community.collections.map(c => c.id)
  
  if (isSelected) {
    // Remove all collections from this community
    selectedCollections.value = selectedCollections.value.filter(
      id => !collectionIds.includes(id)
    )
  } else {
    // Add all collections from this community
    const newSelections = [...selectedCollections.value]
    collectionIds.forEach(id => {
      if (!newSelections.includes(id)) {
        newSelections.push(id)
      }
    })
    selectedCollections.value = newSelections
  }
}

const toggleCollection = (collectionId) => {
  const index = selectedCollections.value.indexOf(collectionId)
  if (index > -1) {
    selectedCollections.value.splice(index, 1)
  } else {
    selectedCollections.value.push(collectionId)
  }
}

const getCollectionName = (collectionId) => {
  for (const community of hierarchy.value) {
    const collection = community.collections.find(c => c.id === collectionId)
    if (collection) {
      return collection.name
    }
  }
  return 'Unknown Collection'
}

// Lifecycle
onMounted(() => {
  loadInitData()
})

// Watch for changes in sourceRid
watch(() => props.sourceRid, loadInitData, { deep: true })
</script>

<style scoped>
.dspace-query-form-compact {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: #fafafa;
  margin: 8px 0;
}

.form-header {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  font-weight: 500;
}

.form-content {
  padding: 12px;
}

.dspace-query-form-compact .v-field {
  font-size: 0.875rem;
}

.dspace-query-form-compact .v-label {
  font-size: 0.75rem;
}

.collection-selector {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 8px 12px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: white;
}

.collection-selector:hover {
  border-color: rgba(0, 0, 0, 0.3);
}

.placeholder-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}

.dropdown-icon {
  color: rgba(0, 0, 0, 0.6);
  margin-left: 8px;
}

.search-criteria-item {
  border-radius: 4px;
}

.search-criteria-item .v-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.search-criteria-item .v-card:hover {
  border-color: rgba(0, 0, 0, 0.3);
}

.query-preview code {
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
