<template>
    <v-row no-gutters class="fill-height">
        <!-- LEFT COLUMN - Original Text -->
        <v-col cols="4" class="text-column original-column">
          <v-sheet class="text-content pa-4">
            <div class="d-flex align-center mb-4">
              <h3 class="mr-4">Original Text</h3>
              <v-chip 
                v-if="state.currentDocIndex !== null && state.docLabels && state.docLabels[state.currentDocIndex]"
                color="primary"
                variant="outlined"
                size="small"
              >
                Doc {{ state.currentDocIndex }}: {{ state.docLabels[state.currentDocIndex] }}
              </v-chip>
              <v-progress-circular 
                v-if="state.loadingOriginalText" 
                indeterminate 
                size="20" 
                class="ml-2"
              ></v-progress-circular>
            </div>
            <div v-if="!state.originalTokens.length && !state.loadingOriginalText" class="text-medium-emphasis">
              Click on a match to load the corresponding original text
            </div>
            <div 
              v-else 
              ref="originalTextContainer"
              class="similarity-text"
            >
              <span
                v-for="(token, index) in state.originalTokens"
                :key="'orig-' + index"
                :data-token-index="index"
                :class="getTokenClass(index, 'original')"
                @click="handleTokenClick(index, 'original')"
              >
                {{ token }}{{ getTokenSeparator(index, 'original') }}
              </span>
            </div>
          </v-sheet>
        </v-col>

        <!-- MIDDLE COLUMN - Query Text -->
        <v-col cols="5" class="text-column query-column">
          <v-sheet class="text-content pa-4">
            <h3 class="mb-4">Query Text</h3>
            <div 
              ref="queryTextContainer"
              class="similarity-text"
            >
              <span
                v-for="(token, index) in state.queryTokens"
                :key="'query-' + index"
                :data-token-index="index"
                :class="getTokenClass(index, 'query')"
                @click="handleTokenClick(index, 'query')"
              >
                {{ token }}{{ getTokenSeparator(index, 'query') }}
              </span>
            </div>
          </v-sheet>
        </v-col>

        <!-- RIGHT COLUMN - Match Statistics (display-specific) -->
        <v-col cols="3" class="controls-column">
          <v-sheet class="pa-4">
            <div v-if="state.similarityData" class="mb-4">
              <h4 class="mb-2">Match Statistics</h4>
              <v-divider class="mb-2"></v-divider>
              <p><strong>Total Matches:</strong> {{ state.similarityData.chunk_count }}</p>
              <p><strong>Max Similarity:</strong> {{ (state.similarityData.max_similarity * 100).toFixed(2) }}%</p>
              <p><strong>Window Size:</strong> {{ state.similarityData.window_size }} tokens</p>
              <p><strong>Overlap:</strong> {{ state.similarityData.overlap }} tokens</p>
              
              <v-divider class="my-4"></v-divider>
              
              <h5 class="mb-2">Matches</h5>
              <v-list class="match-list" max-height="400">
                <v-list-item
                  v-for="(match, index) in state.similarityData.chunk_similarities"
                  :key="index"
                  @click="scrollToMatch(match)"
                  class="match-item"
                  :class="{ 'active-match': state.activeMatchIndex === index }"
                >
                  <v-list-item-title>
                    Match {{ index + 1 }} 
                    <span class="similarity-score">({{ (match.similarity * 100).toFixed(1) }}%)</span>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Doc {{ match.doc_index }}: start  {{ match.text_start_char }}, Query: token {{ match.query_start_token }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
</template>

<script setup>

  import { onMounted, reactive, ref, watch, nextTick } from "vue";

  import web from "../../web.js";
  import {store} from "../../components/Store.js";
  const apiUrl = import.meta.env.VITE_API_PATH

  const originalTextContainer = ref(null)
  const queryTextContainer = ref(null)

  const emit = defineEmits(['change-tab'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => { await load() })
  watch(() => store.file, async (newFile) => { if (newFile) await load() })

  var state = reactive({
      file: null,
      similarityData: null,
      docMap: [],
      docLabels: {},
      originalTexts: {},
      originalTokensMap: {},
      originalTokenCharPositionsMap: {},
      tokenMaps: {},
      queryText: '',
      queryTokens: [],
      queryTokenMap: new Map(),
      currentDocIndex: null,
      originalTokens: [],
      originalTokenCharPositions: [],
      tokenMap: new Map(),
      activeMatchIndex: -1,
      hoveredMatchIndex: -1,
      loadingOriginalText: false
  })

  function tokenize(text) {
    if (!text || typeof text !== 'string') return []
    // Simple tokenization: split by whitespace
    // This should match the backend tokenization if it uses whitespace-based tokenization
    // Note: For exact matching, the backend tokenization algorithm should be used
    return text.split(/\s+/).filter(t => t.length > 0)
  }

  function tokenizeWithCharPositions(text) {
    if (!text || typeof text !== 'string') {
      return { tokens: [], charPositions: [] }
    }
    
    const tokens = []
    const charPositions = []
    let currentPos = 0
    
    // Split by whitespace but preserve the pattern
    const parts = text.split(/(\s+)/)
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part.trim()) {
        // This is a token (non-whitespace)
        tokens.push(part)
        charPositions.push(currentPos)
        currentPos += part.length
      } else if (part) {
        // This is whitespace - just advance position
        currentPos += part.length
      }
    }
    
    return { tokens, charPositions }
  }

  function getOriginalTokenIndex(match, docIndex) {
    // Primary: convert text_start_char (character position) to token index
    if (match.text_start_char !== undefined && state.originalTexts[docIndex] && state.originalTokenCharPositionsMap[docIndex]) {
      const charPos = match.text_start_char
      const charPositions = state.originalTokenCharPositionsMap[docIndex]
      const tokens = state.originalTokensMap[docIndex]
      
      // Find the token index that contains charPos
      // A token contains charPos if: tokenStart <= charPos < tokenEnd
      // where tokenEnd is either the next token's start or end of text
      
      for (let i = 0; i < charPositions.length; i++) {
        const tokenStart = charPositions[i]
        let tokenEnd
        
        if (i < charPositions.length - 1) {
          // Token ends where next token starts
          tokenEnd = charPositions[i + 1]
        } else {
          // Last token - ends at end of text
          tokenEnd = state.originalTexts[docIndex].length
        }
        
        // Check if charPos is within this token's range
        if (charPos >= tokenStart && charPos < tokenEnd) {
          return i
        }
      }
      
      // If charPos is exactly at the end of text, return last token
      if (charPos === state.originalTexts[docIndex].length && charPositions.length > 0) {
        return charPositions.length - 1
      }
      
      // Fallback: if not found by position (shouldn't happen normally), 
      // find the token by counting tokens before charPos
      if (charPos >= 0 && charPos <= state.originalTexts[docIndex].length) {
        // Find which token contains this character position by checking token ranges
        for (let i = 0; i < tokens.length; i++) {
          const tokenStart = charPositions[i]
          const tokenText = tokens[i]
          const tokenEnd = tokenStart + tokenText.length
          
          if (charPos >= tokenStart && charPos <= tokenEnd) {
            return i
          }
        }
        
        // Last resort: count tokens up to charPos
        const beforeText = state.originalTexts[docIndex].substring(0, Math.max(0, charPos))
        const beforeTokens = tokenize(beforeText)
        return Math.min(beforeTokens.length, tokens.length - 1)
      }
    }
    
    // Fallback: Use text_start_token if available (token index)
    if (match.text_start_token !== undefined) {
      return match.text_start_token
    }
    
    // Fallback: try original_start_token (for backwards compatibility)
    if (match.original_start_token !== undefined) {
      return match.original_start_token
    }
    
    // Fallback: if start_token is character position, convert it
    if (match.start_token !== undefined && state.originalTexts[docIndex]) {
      const text = state.originalTexts[docIndex]
      const charPos = match.start_token
      
      if (typeof text === 'string' && charPos >= 0 && charPos <= text.length) {
        const beforeText = text.substring(0, charPos)
        const tokens = tokenize(beforeText)
        return tokens.length
      }
    }
    
    // Last fallback: treat start_token as token index (backwards compatibility)
    return match.start_token !== undefined ? match.start_token : 0
  }

  function getTokenSeparator(index, type) {
    const tokens = type === 'original' ? state.originalTokens : state.queryTokens
    // Always add a space between tokens except for the last one
    return index < tokens.length - 1 ? ' ' : ''
  }

  function getTokenClass(tokenIndex, type) {
    const classes = ['token']
    
    // Check if this token is part of any match
    const matches = getMatchesForToken(tokenIndex, type)
    
    if (matches.length > 0) {
      classes.push('matched-token')
      
      // Highlight active match
      if (state.activeMatchIndex !== -1 && matches.includes(state.activeMatchIndex)) {
        classes.push('active-match-token')
      }
      
      // Highlight hovered match
      if (state.hoveredMatchIndex !== -1 && matches.includes(state.hoveredMatchIndex)) {
        classes.push('hovered-match-token')
      }
      
      // Color based on similarity score
      const match = state.similarityData.chunk_similarities[matches[0]]
      if (match) {
        const similarity = match.similarity
        if (similarity >= 0.95) {
          classes.push('high-similarity')
        } else if (similarity >= 0.8) {
          classes.push('medium-similarity')
        } else {
          classes.push('low-similarity')
        }
      }
    }
    
    return classes.join(' ')
  }

  function getMatchesForToken(tokenIndex, type) {
    if (type === 'original') {
      return state.tokenMap.get(tokenIndex) || []
    } else {
      return state.queryTokenMap.get(tokenIndex) || []
    }
  }

  function buildTokenMaps(docIndex = null) {
    state.queryTokenMap.clear()
    
    if (!state.similarityData || !state.similarityData.chunk_similarities) return
    
    // Always build query token map for all matches
    state.similarityData.chunk_similarities.forEach((match, matchIndex) => {
      const windowSize = state.similarityData.window_size || 15
      
      // Map query tokens
      for (let i = 0; i < windowSize; i++) {
        const queryTokenIndex = match.query_start_token + i
        if (!state.queryTokenMap.has(queryTokenIndex)) {
          state.queryTokenMap.set(queryTokenIndex, [])
        }
        state.queryTokenMap.get(queryTokenIndex).push(matchIndex)
      }
    })
    
    // Build document token maps for specific doc or all docs
    if (docIndex !== null) {
      // Build for specific document
      if (!state.tokenMaps[docIndex]) {
        state.tokenMaps[docIndex] = new Map()
      }
      state.tokenMaps[docIndex].clear()
      
      state.similarityData.chunk_similarities.forEach((match, matchIndex) => {
        const windowSize = state.similarityData.window_size || 15
        const docIdx = match.doc_index !== undefined ? match.doc_index : 0
        
        if (docIdx === docIndex) {
          const originalTokenStart = getOriginalTokenIndex(match, docIdx)
          for (let i = 0; i < windowSize; i++) {
            const tokenIndex = originalTokenStart + i
            if (!state.tokenMaps[docIdx].has(tokenIndex)) {
              state.tokenMaps[docIdx].set(tokenIndex, [])
            }
            state.tokenMaps[docIdx].get(tokenIndex).push(matchIndex)
          }
        }
      })
      
      // Update current token map if this is the displayed document
      if (state.currentDocIndex === docIndex && state.tokenMaps[docIndex]) {
        state.tokenMap = state.tokenMaps[docIndex]
      }
    } else {
      // Build for all documents found in matches
      const allDocIndices = new Set()
      state.similarityData.chunk_similarities.forEach(match => {
        const docIdx = match.doc_index !== undefined ? match.doc_index : 0
        allDocIndices.add(docIdx)
      })
      
      allDocIndices.forEach(docIdx => {
        if (!state.tokenMaps[docIdx]) {
          state.tokenMaps[docIdx] = new Map()
        }
        state.tokenMaps[docIdx].clear()
        
        state.similarityData.chunk_similarities.forEach((match, matchIndex) => {
          const windowSize = state.similarityData.window_size || 15
          const matchDocIdx = match.doc_index !== undefined ? match.doc_index : 0
          
          if (matchDocIdx === docIdx) {
            const originalTokenStart = getOriginalTokenIndex(match, docIdx)
            for (let i = 0; i < windowSize; i++) {
              const tokenIndex = originalTokenStart + i
              if (!state.tokenMaps[docIdx].has(tokenIndex)) {
                state.tokenMaps[docIdx].set(tokenIndex, [])
              }
              state.tokenMaps[docIdx].get(tokenIndex).push(matchIndex)
            }
          }
        })
      })
      
      // Update current token map if displaying a document
      if (state.currentDocIndex !== null && state.tokenMaps[state.currentDocIndex]) {
        state.tokenMap = state.tokenMaps[state.currentDocIndex]
      }
    }
  }
  
  async function loadOriginalText(docIndex) {
    if (state.loadingOriginalText) return
    
    // Check if already loaded
    if (state.originalTexts[docIndex] && state.originalTokensMap[docIndex]) {
      state.currentDocIndex = docIndex
      state.originalTokens = state.originalTokensMap[docIndex]
      state.originalTokenCharPositions = state.originalTokenCharPositionsMap[docIndex] || []
      state.tokenMap = state.tokenMaps[docIndex] || new Map()
      return
    }
    
    // Get RID from doc_map
    if (!state.docMap || !state.docMap[docIndex]) {
      console.warn(`No RID found for doc_index ${docIndex}`)
      return
    }
    
    let rid = state.docMap[docIndex]
    if (!rid) {
      console.warn(`Invalid RID for doc_index ${docIndex}`)
      return
    }
    
    // Ensure RID format (add # prefix if missing and it's a valid RID format)
    if (typeof rid === 'string' && !rid.startsWith('#') && rid.includes(':')) {
      rid = '#' + rid
    }
    
    state.loadingOriginalText = true
    
    try {
      // Load the text file
      const text = await web.getNodeFile(rid)
      const textStr = typeof text === 'string' ? text : String(text)
      state.originalTexts[docIndex] = textStr
      
      // Tokenize with character positions and cache
      const { tokens, charPositions } = tokenizeWithCharPositions(textStr)
      state.originalTokensMap[docIndex] = tokens
      state.originalTokenCharPositionsMap[docIndex] = charPositions
      
      // Load document info for label
      try {
        const docInfo = await web.getDocInfo(rid)
        if (docInfo && docInfo.label) {
          state.docLabels[docIndex] = docInfo.label
        }
      } catch (e) {
        console.warn(`Could not load doc info for ${rid}:`, e)
      }
      
      // Rebuild token maps for this document
      buildTokenMaps(docIndex)
      
      // Switch to this document
      state.currentDocIndex = docIndex
      state.originalTokens = state.originalTokensMap[docIndex]
      state.originalTokenCharPositions = state.originalTokenCharPositionsMap[docIndex] || []
      state.tokenMap = state.tokenMaps[docIndex] || new Map()
    } catch (error) {
      console.error(`Error loading original text for doc_index ${docIndex}:`, error)
    } finally {
      state.loadingOriginalText = false
    }
  }

  async function handleTokenClick(tokenIndex, type) {
    const matches = getMatchesForToken(tokenIndex, type)
    if (matches.length > 0) {
      // Use the first match
      const matchIndex = matches[0]
      await scrollToMatch(state.similarityData.chunk_similarities[matchIndex], matchIndex)
    }
  }

  async function scrollToMatch(match, matchIndex = null) {
    if (!match) return
    
    if (matchIndex === null) {
      matchIndex = state.similarityData.chunk_similarities.findIndex(m => {
        const docIdx = m.doc_index !== undefined ? m.doc_index : 0
        const matchDocIdx = match.doc_index !== undefined ? match.doc_index : 0
        const mOriginalToken = getOriginalTokenIndex(m, docIdx)
        const matchOriginalToken = getOriginalTokenIndex(match, matchDocIdx)
        return mOriginalToken === matchOriginalToken && 
               m.query_start_token === match.query_start_token &&
               m.doc_index === match.doc_index
      })
    }
    
    state.activeMatchIndex = matchIndex
    
    // Get doc_index from match (default to 0 for backwards compatibility)
    const docIndex = match.doc_index !== undefined ? match.doc_index : 0
    
    // Load original text if needed
    if (state.currentDocIndex !== docIndex) {
      await loadOriginalText(docIndex)
      await nextTick() // Wait for DOM to update
    }
    
    // Get the original token index for this match
    const originalTokenIndex = getOriginalTokenIndex(match, docIndex)
    
    // Scroll original text to the match
    await nextTick()
    if (originalTextContainer.value && typeof originalTextContainer.value.querySelector === 'function' && state.originalTokens && originalTokenIndex < state.originalTokens.length) {
      const tokenElement = originalTextContainer.value.querySelector(`[data-token-index="${originalTokenIndex}"]`)
      if (tokenElement && typeof tokenElement.scrollIntoView === 'function') {
        tokenElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Highlight briefly
        tokenElement.classList.add('highlight-flash')
        setTimeout(() => tokenElement.classList.remove('highlight-flash'), 1000)
      }
    }
    
    // Scroll query text to the match
    await nextTick()
    if (queryTextContainer.value && typeof queryTextContainer.value.querySelector === 'function' && state.queryTokens && match.query_start_token < state.queryTokens.length) {
      const tokenElement = queryTextContainer.value.querySelector(`[data-token-index="${match.query_start_token}"]`)
      if (tokenElement && typeof tokenElement.scrollIntoView === 'function') {
        tokenElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Highlight briefly
        tokenElement.classList.add('highlight-flash')
        setTimeout(() => tokenElement.classList.remove('highlight-flash'), 1000)
      }
    }
  }

  async function load() {
    state.file = null
    state.similarityData = null
    state.docMap = []
    state.docLabels = {}
    state.originalTexts = {}
    state.originalTokensMap = {}
    state.originalTokenCharPositionsMap = {}
    state.tokenMaps = {}
    state.queryText = ''
    state.queryTokens = []
    state.queryTokenMap.clear()
    state.currentDocIndex = null
    state.originalTokens = []
    state.originalTokenCharPositions = []
    state.tokenMap.clear()
    state.activeMatchIndex = -1
    state.loadingOriginalText = false

    var similarityDataFile = await web.getNodeFile(store.file['@rid'])
    state.file = store.file

    if (typeof similarityDataFile === 'string') {
      try {
        state.similarityData = JSON.parse(similarityDataFile)
      } catch (e) {
        state.similarityData = similarityDataFile
      }
    } else {
      state.similarityData = similarityDataFile
    }

    if (state.similarityData && state.similarityData.doc_map) {
      state.docMap = state.similarityData.doc_map
    } else if (state.similarityData && state.similarityData.text_file) {
      state.docMap = [state.similarityData.text_file]
      await loadOriginalText(0)
    }

    if (state.similarityData && state.similarityData.query_text) {
      state.queryText = state.similarityData.query_text
      state.queryTokens = tokenize(state.queryText)
    }

    buildTokenMaps()
  }

  onMounted(async () => {
    await load()
  })

</script>

<style scoped>
.text-column {
  height: calc(100vh - 120px);
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.query-column {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.controls-column {
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.text-content {
  background-color: white;
  min-height: 100%;
}

.similarity-text {
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.token {
  display: inline;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 2px 1px;
  border-radius: 2px;
}

.token:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.matched-token {
  position: relative;
}

.high-similarity {
  background-color: rgba(76, 175, 80, 0.2);
  border-bottom: 2px solid rgba(76, 175, 80, 0.6);
}

.medium-similarity {
  background-color: rgba(255, 193, 7, 0.2);
  border-bottom: 2px solid rgba(255, 193, 7, 0.6);
}

.low-similarity {
  background-color: rgba(255, 87, 34, 0.2);
  border-bottom: 2px solid rgba(255, 87, 34, 0.6);
}

.active-match-token {
  background-color: rgba(33, 150, 243, 0.3) !important;
  border-bottom: 3px solid rgba(33, 150, 243, 0.8) !important;
  box-shadow: 0 0 4px rgba(33, 150, 243, 0.4);
}

.hovered-match-token {
  background-color: rgba(156, 39, 176, 0.2) !important;
}

.highlight-flash {
  animation: flash 0.5s ease;
}

@keyframes flash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(255, 235, 59, 0.5); }
}

.match-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.match-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.match-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.match-item.active-match {
  background-color: rgba(33, 150, 243, 0.1);
  border-left: 3px solid rgba(33, 150, 243, 0.8);
}

.similarity-score {
  font-size: 0.85em;
  color: rgba(0, 0, 0, 0.6);
  font-weight: normal;
}
</style>

