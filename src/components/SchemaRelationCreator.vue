<style scoped>
 .input-group {
	 font-weight: normal;
 }
 .incoming {
	 color:red;
	 font-weight: bold;
 }
 .outgoing {
	 font-weight: normal;
 }
</style>

<template>


	<div class="offcanvas offcanvas-end" tabindex="-1" id="schemaRelationEditor" aria-labelledby="offcanvasRightLabel" style="width:450px" v-if="editor">
		<div class="offcanvas-header">
			<h5 id="offcanvasRightLabel">Schema Relation Editor</h5>
			<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
		</div>

		<div class="offcanvas-body">
			<div v-if="!editor.current_rel">from <b>{{store.current().data.name}}</b> to:
				<select v-model="state.target">
					<option value="">choose target</option>
					<option v-for="s in state.schemas" :key="s.type" :value="s.type">
						{{s.label}}
					</option>
				</select>
			</div>


			<!-- EDITOR -->
			<div v-if="editor.current_rel" :class="['node-plain']">



				<h5 v-if="editor.current_rel.direction == 'incoming'">
					{{store.current().data.name}}
					<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
					{{editor.current_rel.type}} <i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>  {{editor.current_rel.target}}
				</h5>
				<h5 v-if="editor.current_rel.direction == 'outgoing'">
					{{store.current().data.name}}
					<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
					{{editor.current_rel.type}} <i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>  {{editor.current_rel.target}}
				</h5>


				<!-- LABELS -->
				<div class="alert alert-info mt-4"> Relation labels are human friendly way to present directional graph. You can change relation labels any time.</div>

				<!-- LABELS INCOMING -->
				<template v-if="editor.current_rel.direction == 'incoming'">
					Graph label
				   <div :class="['input-group', 'mb-3']">
						<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
							<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
						</span>
						<input @blur="saveRelationAttribute('label')" v-model="editor.current_rel.label" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
						<span class="input-group-text" :class="['node',editor.current_rel.target]">
							<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
							{{editor.current_rel.target}}</span>
					</div>
					List label
					<div :class="['input-group', 'mb-3']">
						<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
							<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
						</span>
						<input @blur="saveRelationAttribute('label_rev')" v-model="editor.current_rel.label_rev" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
						<span class="input-group-text" :class="['node',editor.current_rel.target]" >
							<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
							{{editor.current_rel.target}}
						</span>
					</div>



				</template>
				<!-- LABELS OUTGOING -->
				<template v-else>
					Graph label
					<div :class="['input-group', 'mb-3']">
						<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
							<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
						</span>
						<input @blur="saveRelationAttribute('label')" v-model="editor.current_rel.label" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
						<span class="input-group-text" :class="['node',editor.current_rel.target]">
							<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
							{{editor.current_rel.target}}</span>
					</div>
					List label
					<div :class="['input-group', 'mb-3']">
						<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
							<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
						</span>
						<input @blur="saveRelationAttribute('label_rev')" v-model="editor.current_rel.label_rev" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
						<span class="input-group-text" :class="['node',editor.current_rel.target]" >
							<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
							{{editor.current_rel.target}}
						</span>
					</div>
                    Inactive Graph Label
                    <div :class="['input-group', 'mb-3']">
                        <input @blur="saveRelationAttribute('label_inactive')" v-model="editor.current_rel.label_inactive" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
                    </div>


				</template>

				<!-- TAGS -->
				<div class="alert alert-info mt-4">Relationg Tags allow grouping of relations for easier browsing of graph. </div>

				<ul v-if="Array.isArray(editor.current_rel.tags)">
					<li v-for="tag in editor.current_rel.tags" class="badge bg-secondary"> {{tag}}
						<div role="button" @click="unsetTag(tag)">
							<i class="bi bi-x-circle pointer" style="font-size: 1rem; color: red;"></i>
						</div>
					</li>
				</ul>
				<ul v-else-if="editor.current_rel.tags.trim() != 'cypher.null'">
				<li class="badge bg-secondary">
					{{editor.current_rel.tags}}
					<div role="button" @click="unsetTag(editor.current_rel.tags)">
						<i class="bi bi-x-circle pointer" style="font-size: 1rem; color: red;"></i>
					</div>
				</li>
				</ul>


				<select @change="setTag()" v-model="state.selected_tag">
					<option value="">choose tag (optional)</option>
					<option v-for="tag in store.tags" :key="tag.label" :value="tag.id">
						{{tag.label}}
					</option>
				</select>
				<div role="button" @click="state.tag_editor_open = !state.tag_editor_open" class="ms-2" title="create new tag"><i class="bi bi-plus-circle" style="font-size: 1rem; color: blue;"></i></div>
				<!-- tag creator -->
				<div v-if="state.tag_editor_open" class="input-group mb-3">
					<input  v-model="state.new_tag.id" type="text" class="form-control" aria-label="tagid" aria-describedby="basic-addon1" placeholder="tag ID">
					<input  v-model="state.new_tag.label" type="text" class="form-control" aria-label="taglabel" placeholder="tag name" aria-describedby="basic-addon1">
				<div role="button" @click="createTag()" class="btn btn-primary float-end">Create tag</div>
				</div>

				<!-- COMPOUND -->
				<div class="alert alert-info mt-4">When Compound is set, it means that the <b>target node</b> is rendered as compound node that visually includes nodes with this relation. This can be changed any time.</div>
				<div class="form-check">
				  <input @change="saveRelationAttribute('compound')" class="form-check-input" type="checkbox" id="flexCheckDefault" v-model="editor.current_rel.compound">
				  <label class="form-check-label" for="flexCheckDefault">
					Compound

				  </label>
				</div>



				<!-- REMOVE BUTTON-->
				<div class="alert alert-info mt-4">If your remove schema relation, then existing relations are NOT REMOVED. <b>They are shown in graph but they are not listed on node's relation listing</b>. </div>
				<button @click="removeConnection(editor.current_rel.rid)" type="button" class="btn btn-danger float-end mt-4"><i class="bi bi-trash" style="font-size: 1rem; color: white;"></i></button>
			</div>


			<!-- CREATOR -->
			<template v-if="state.target">
				<div class="mt-4">Descriptive Relation ID (like "IS_PART_OF")</div>
				<input v-model="relation.type" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">

				<div class="mt-4">Link label shown in graph visualisation (forward)</div>
				<div class="input-group mb-3" >
					<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
						<i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
					</span>

					<input v-model="relation.attributes.label" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">
					<span class="input-group-text" :class="['node',state.target]">
						<i class="pl-4 bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
						{{state.target}}</span>
				</div>
				<div class="mt-4">Link label shown in list view (reverse)</div>
				<div class="input-group mb-3" >
					<span class="input-group-text" id="basic-addon1" :class="['node',store.current().data.name]">{{store.current().data.name}}
						<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
					</span>


					<input v-model="relation.attributes.label_rev" type="text" class="form-control" aria-label="Username" aria-describedby="basic-addon1">

					<span class="input-group-text" :class="['node',state.target]">
						<i class="bi bi-arrow-left-short" style="font-size: 1rem; color: blue;"></i>
						{{state.target}}
					</span>
				</div>

				<!-- AUTO TAG -->
				<div class="alert alert-info mt-4">Relation groups is used to define what relations are offered to users. </div>
				<div>Relation Group</div>
                <div class="alert alert-danger">aseta editoinnin kautta</div>
				<!-- <select v-model="relation.attributes.tags">
					<option value="">choose tag (optional)</option>
					<option v-for="tag in store.tags" :key="tag.id" :value="tag.id">
						{{tag.label}}
					</option>
				</select> -->


				<div class="alert alert-info mt-4">Parent/Child relation are rendered as compound nodes. This setting can be changed any time.</div>
				<div class="form-check">
				  <input class="form-check-input" type="checkbox" value="parent" id="flexCheckDefault" v-model="relation.attributes.compound">
				  <label class="form-check-label" for="flexCheckDefault">
					Parent/Child relation

				  </label>
				</div>

				<div class="mt-4">
					<div role="button" @click="createConnection()" class="btn btn-primary float-end">Create relation</div>
				</div>
			</template>


		</div>
	</div>

</template>

<script setup>
	import { watch, onMounted, reactive } from "vue";
	import { useRouter, useRoute } from 'vue-router';
	import web from "../web.js";
	import {store} from "./Store.js";

	const route  = useRoute();
	const router = useRouter();
	const state = reactive({
		schemas:[],
		target: '',
		new_tag: {id: '', label: ''},
		selected_tag: '',
		tag_editor_open: false

	})
	const relation = reactive({
		tag: '',
		type: '',
		attributes:{
			label:'',
			label_rev:'',
            label_inactive:'',
			compound: '',
			tags: []
		}
	})

	const props = defineProps({
		editor: {}
	})

	watch(
	  () => route.query.node,
	  async (newValue, oldValue) => {
		  state.schemas = await web.getSchemas()
		  state.tags = await web.getTags()
		  reset()
	})

	async function createConnection() {
		var target_rid = state.schemas.find(s => s.type == state.target)
		//if(relation.attributes.tags) relation.attributes.tags = [relation.attributes.tags]
        relation.attributes.tags = []
		await web.connectSchema(route.query.node, relation, target_rid['rid'])
		state.target = null
		store.reload()
	}

	async function setTag(val) {
		var tags = [].concat(props.editor.current_rel.tags)
		tags.push(state.selected_tag)
		props.editor.current_rel.tags = [...new Set(tags)]
		await saveRelationAttribute('tags')
		state.selected_tag = ''
	}

	async function unsetTag(tag_id) {
		var tags = [].concat(props.editor.current_rel.tags)
		console.log(tag_id)
		var tags_updated = tags.filter(item => item !== tag_id)
        props.editor.current_rel.tags = tags_updated
		if(tags_updated.length === 0) {
            tags_updated = null
            props.editor.current_rel.tags = []
        }
		await saveRelationAttribute('tags')
	}


	async function createTag() {
		if(state.new_tag.id != '' && state.new_tag.label != '') {
			await web.createNode({type:'Tag', label: state.new_tag.label, id: state.new_tag.id})
			state.new_tag = {id:''}
			store.tags = await web.getTags()
		} else {
            alert('Give both ID and name!')
        }
	}


	async function saveRelationAttribute(attr) {

		var result = await web.setRelationAttribute(props.editor.current_rel.rid, {name: attr, value: props.editor.current_rel[attr]})

		store.reload()
	}


	async function removeConnection(rid) {
		await web.removeEdgeByRID(rid)
		props.editor.current_rel = null
		store.reload()
	}

	function reset() {
		relation.tag = ''
		relation.type = ''
		relation.target = ''
		relation.attributes = {label:'', label_rev:'', compound: '', tags: ''}
	}


	onMounted(async()=> {
		state.schemas = await web.getSchemas()
		reset()

	})

</script>
