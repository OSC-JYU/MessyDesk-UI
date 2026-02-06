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
    
    <div class="form-content">
      <!-- Scope Selection (single collection/community/site) -->
      <div class="mb-2">
        <v-label class="text-caption text-medium-emphasis mb-2 d-block">Scope (optional)</v-label>
        <v-card variant="outlined" class="scope-card">
          <v-card-text class="pa-2">
            <div v-if="!selectedScope" class="scope-placeholder">
              <v-icon icon="mdi-folder-outline" size="small" class="mr-2"></v-icon>
              <span>No scope selected - will search all items</span>
            </div>
            <div v-else class="scope-selected">
              <div class="d-flex align-center">
                <v-icon icon="mdi-folder" size="small" color="primary" class="mr-2"></v-icon>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">Selected Scope:</div>
                  <div class="font-weight-medium">{{ getScopeName(selectedScope) }}</div>
                </div>
                <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-close"
                  @click="clearScope"
                  class="ml-2"
                ></v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="outlined"
              prepend-icon="mdi-folder-search"
              class="mt-2"
              block
            >
              {{ selectedScope ? 'Change Scope' : 'Select Scope' }}
            </v-btn>
          </template>
          <v-card min-width="300" max-height="400">
            <v-card-text class="pa-2">
              <div class="text-caption text-medium-emphasis mb-2">
                Select one scope (collection or community):
              </div>
              <v-divider class="mb-2"></v-divider>
              <v-radio-group v-model="selectedScope" class="pa-0">
                <div v-for="community in hierarchy" :key="community.id" class="mb-3">
                  <v-radio
                    :label="community.name"
                    :value="community.id"
                    density="compact"
                    class="font-weight-bold text-primary mb-1"
                  />
                  <div class="ml-4">
                    <v-radio
                      v-for="collection in community.collections"
                      :key="collection.id"
                      :label="collection.name"
                      :value="collection.id"
                      density="compact"
                      class="mb-1"
                    />
                  </div>
                </div>
              </v-radio-group>
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
              
              <!-- Match Type / Filter Operator -->
              <v-select
                v-model="criteria.matchType"
                :items="matchTypes"
                label="Operator"
                variant="outlined"
                density="compact"
                hide-details
                style="min-width: 140px;"
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
        <div v-if="queryPreview" class="query-preview mb-2">
          <v-label class="text-caption text-medium-emphasis mb-1 d-block">Query Preview:</v-label>
          <v-card variant="outlined" class="pa-2">
            <div class="text-caption mb-1">
              <strong>Solr Query:</strong> 
              <code class="query-code">{{ queryPreview.query || '(empty)' }}</code>
            </div>
            <div v-if="queryPreview.scope" class="text-caption mt-1">
              <strong>Scope:</strong> {{ queryPreview.scope }} ({{ getScopeName(queryPreview.scope) }})
            </div>
            <div class="text-caption mt-1"><strong>DSO Type:</strong> item</div>
            <div class="text-caption mt-2">
              <strong>URL Query String:</strong>
              <code class="query-url">{{ buildPreviewUrl() }}</code>
            </div>
          </v-card>
        </div>
      </div>

      <!-- Pagination Options -->
      <div class="mb-2">
        <v-label class="text-caption text-medium-emphasis mb-2 d-block">Pagination</v-label>
        <div class="d-flex gap-2">
          <v-text-field
            v-model.number="page"
            label="Page"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            hide-details
            style="flex: 1;"
          />
          <v-text-field
            v-model.number="size"
            label="Size"
            type="number"
            min="1"
            variant="outlined"
            density="compact"
            hide-details
            style="flex: 1;"
          />
          <v-text-field
            v-model="sort"
            label="Sort (e.g., score,DESC)"
            placeholder="score,DESC"
            variant="outlined"
            density="compact"
            hide-details
            style="flex: 2;"
          />
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
const selectedScope = ref(null)
// Always use 'item' for DSpace object type
const dsoType = 'item'
const queryText = ref('')
const availableCollections = ref([])
const availableFields = ref([])
const hierarchy = ref([])
const searchCriteria = ref([])
// Pagination
const page = ref(0)
const size = ref(10)
const sort = ref('score,DESC')

// Match types for Solr query syntax
const matchTypes = [
  { title: 'Contains', value: 'contains' },
  { title: 'Exact Match', value: 'exact' },
  { title: 'Not Contains', value: 'notcontains' },
  { title: 'Starts With (wildcard)', value: 'wildcard_start' },
  { title: 'Ends With (wildcard)', value: 'wildcard_end' },
  { title: 'Contains (wildcard)', value: 'wildcard_contains' }
]

// Helper to convert match type to Solr query syntax
const buildSolrQueryValue = (value, matchType) => {
  const trimmedValue = value.trim()
  
  switch (matchType) {
    case 'exact':
      // Exact match - use quotes
      return `"${trimmedValue}"`
    case 'wildcard_start':
      return `${trimmedValue}*`
    case 'wildcard_end':
      return `*${trimmedValue}`
    case 'wildcard_contains':
      return `*${trimmedValue}*`
    case 'contains':
    default:
      // Default contains - use as-is, quote if needed
      if (needsQuotes(trimmedValue)) {
        return `"${trimmedValue}"`
      }
      return trimmedValue
  }
}

// Helper to check if value needs quotes in Solr
const needsQuotes = (value) => {
  // Check for special characters that need quoting
  const specialChars = /[:*+\-&|!(){}[\]^"~?\\]/
  return specialChars.test(value) || value.includes(' ')
}

// Generate query preview
const queryPreview = computed(() => {
  const validCriteria = searchCriteria.value.filter(c => c.fieldId && c.value && c.value.trim())
  const generalQuery = queryText.value.trim()
  
  const solrQueryParts = []
  
  // Process search criteria - convert all to Solr query syntax
  validCriteria.forEach(criteria => {
    const fieldName = getFieldName(criteria.fieldId)
    if (!fieldName) return
    
    const value = criteria.value.trim()
    
    if (criteria.matchType === 'notcontains') {
      // For NOT contains, format as NOT fieldName:value
      const solrValue = buildSolrQueryValue(value, 'contains') // Use contains logic for the value
      solrQueryParts.push(`NOT ${fieldName}:${solrValue}`)
    } else {
      const solrValue = buildSolrQueryValue(value, criteria.matchType)
      solrQueryParts.push(`${fieldName}:${solrValue}`)
    }
  })
  
  // Add general query to Solr query parts
  if (generalQuery) {
    solrQueryParts.push(generalQuery)
  }
  
  return {
    query: solrQueryParts.length > 0 ? solrQueryParts.join(' AND ') : '',
    scope: selectedScope.value || null,
    dsoType: 'item'
  }
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

// Helper function to encode URL query parameter value
const encodeQueryParam = (value) => {
  return encodeURIComponent(value)
}

const executeQuery = () => {
  // Build query parameters according to DSpace 7 API schema
  const params = {}
  
  // Add query parameter (Solr query string) - this includes all field searches
  if (queryPreview.value.query) {
    params.query = queryPreview.value.query
  }
  
  
  // Add scope (single UUID)
  if (queryPreview.value.scope) {
    params.scope = queryPreview.value.scope
  }
  
  // Add pagination parameters
  if (sort.value && sort.value.trim()) {
    params.sort = sort.value.trim()
  }
  if (page.value !== null && page.value !== undefined) {
    params.page = page.value
  }
  if (size.value !== null && size.value !== undefined) {
    params.size = size.value
  }
  
  // Build URL query string
  const queryString = Object.keys(params)
    .map(key => `${encodeQueryParam(key)}=${encodeQueryParam(params[key])}`)
    .join('&')
  
  const query = {
    params: params,
    queryString: queryString,
    preview: queryPreview.value,
    // Backward compatibility: include solrQuery
    solrQuery: queryPreview.value.query,
    scopeLabel: getScopeName(queryPreview.value.scope),
    timestamp: new Date().toISOString()
  }
  
  emit('query-executed', query)
  console.log('DSpace Query:', query)
  console.log('Query URL string:', queryString)
}

// Helper function to get field name from field ID
const getFieldName = (fieldId) => {
  const field = availableFields.value.find(f => f.id === fieldId)
  return field ? field.name : null
}

// Build preview URL query string
const buildPreviewUrl = () => {
  const params = []
  
  // Add sort
  if (sort.value && sort.value.trim()) {
    params.push(`sort=${encodeURIComponent(sort.value.trim())}`)
  }
  
  // Add page
  if (page.value !== null && page.value !== undefined) {
    params.push(`page=${page.value}`)
  }
  
  // Add size
  if (size.value !== null && size.value !== undefined) {
    params.push(`size=${size.value}`)
  }
  
  // Add query (contains all field searches in Solr syntax)
  if (queryPreview.value.query) {
    params.push(`query=${encodeURIComponent(queryPreview.value.query)}`)
  }
  
  // Add scope
  if (queryPreview.value.scope) {
    params.push(`scope=${encodeURIComponent(queryPreview.value.scope)}`)
  }
  
  
  return params.join('&')
}

// Search criteria management
const addSearchCriteria = () => {
  searchCriteria.value.push({
    fieldId: null,
    matchType: 'contains',
    value: ''
  })
}

const removeSearchCriteria = (index) => {
  searchCriteria.value.splice(index, 1)
}

// Helper methods for scope selection
const clearScope = () => {
  selectedScope.value = null
}

const getScopeName = (scopeId) => {
  // Check if it's a community
  const community = hierarchy.value.find(c => c.id === scopeId)
  if (community) {
    return community.name
  }
  
  // Check if it's a collection
  for (const comm of hierarchy.value) {
    const collection = comm.collections.find(c => c.id === scopeId)
    if (collection) {
      return collection.name
    }
  }
  
  return 'Unknown Scope'
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
  width: 100%;
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

.scope-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.scope-placeholder {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
  padding: 4px 0;
}

.scope-selected {
  padding: 4px 0;
}

.scope-selected .font-weight-medium {
  color: rgba(0, 0, 0, 0.87);
  font-size: 0.875rem;
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

.query-code {
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  white-space: pre-wrap;
  display: inline-block;
  margin-left: 4px;
}

.query-url {
  display: block;
  background-color: #f5f5f5;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  white-space: normal;
  margin-top: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
