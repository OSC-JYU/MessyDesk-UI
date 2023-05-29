<template>

	<div>


		<template v-if="editing && store.user.access == 'admin'">

			<p>
			  <button class="btn btn-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSettings" aria-expanded="false" aria-controls="collapseSettings">
			    Settings
			  </button>
			</p>
			<div class="collapse" id="collapseSettings">
			  <div class="card card-body">

		  		<!-- PUBLICITY -->
		  		<div class="form-check" title="Check this is you want that everyone can add new nodes of this type">
		  			<input @change="setPublicity()" v-model="state._public" class="form-check-input" type="checkbox" value="" id="flexCheckDefault"  >
		  			<label class="form-check-label" for="flexCheckDefault">
		  				Anyone can create
		  			</label>
		  		</div>
		  		<!-- PUBLICITY ENDS-->

				<!-- STYLE -->
				<h5 class="mt-5">Style override</h5>
                <div class="form-floating">
                    <textarea v-model="state._style" class="form-control" placeholder="Leave a comment here" id="floatingTextarea2" style="height: 250px"></textarea>
                    <label for="floatingTextarea2">cytoscape.js style</label>
                </div>
				<button @click="setStyle()" class="btn btn-primary">save</button>
				 <p class="alert alert-info">Must be valid JSON.  <a href="https://js.cytoscape.org/#style" target="_blank">https://js.cytoscape.org/#style</a></p>
				 <!-- STYLE ENDS -->

			  </div>
			</div>



		<h4 class="card-title">Attributes  </h4>
		<p><b>Label</b> and <b>description</b> attributes are available for all nodes by default.</p>

		<ol class="list-group">
			<template class="list-group-item" v-for="attr of state.attributes" :key="attr.key">
				<template v-if="!attr.key.startsWith('_')">
					<div v-if="editing && store.user.access == 'admin'">
						<div v-if="editor.current_attr.key == attr.key">
							<input v-model="editor.current_attr.key" type="text" class="form-control" aria-label="key">
							<button class="btn btn-primary float-end">save</button>
							<button class="btn btn-secondary float-end" @click="editor.current_attr.key = ''">cancel</button>
						</div>
						<div v-else>
							<div>{{attr.key}}
								<div v-if="props.editing" role="button" @click="toggleEdit(attr)" class="float-end"><i class="fs-8 bi-pen" style="color: cornflowerblue;"></i></div>
							</div>
						</div>
					</div>
					<div v-else>
						{{attr.key}}
					</div>
				</template>
			</template>
		</ol>



		<div @click="toggleNewAttributeEditor()" v-if="props.editing" title="add attribute" role="button" class="float-end">
			<i class="fs-5 bi-plus-circle" style="color: blue;"></i>
		</div>

		<div v-if="editor.showNewAttributeEditor" class="clearfix me-5">

			<div class="form-floating mb-3">
				<input v-model="editor.new_attr.key" type="text" class="form-control" id="floatingInput" placeholder="name of attribute">
				<label for="floatingInput">name of attribute</label>
			</div>
			<button @click="createProperty()">Create attribute</button>
		</div>
		</template>

	</div>

</template>


<script setup>
	import { onMounted, watch, reactive, ref} from "vue";
	import { useRoute } from 'vue-router'
	import {store} from "./Store.js";
	import web from "../web.js";

	const props = defineProps({
		editing: false
	})
	var editor = reactive({
		current_attr: {key:''},
		showNewEditor: false,
		new_attr: {key:'', value:''}
	})


	const route  = useRoute();

	var state = reactive({node:[], attributes:[], _public: false})
	const hidden_keys = ['label', '@rid', '@type', 'parent', 'id']


	watch(() => route.query.node, async (newValue, oldValue) => {
		if(newValue) {
			state.node = await web.getNodeAttributes(route.query.node)
			prepare()
		}
	})

	onMounted(async()=> {
		if(route.query.node)
			state.node = await web.getNodeAttributes(route.query.node)
			prepare()
	})

	function toggleEdit(attr) {
		if(!editor.current_attr.key) {
			editor.current_attr.key = attr.key
		} else {
			editor.current_attr.key = ''
		}
	}

	function toggleNewAttributeEditor() {
		if(editor.showNewAttributeEditor) {
			editor.showNewAttributeEditor = false
		} else {
			editor.showNewAttributeEditor = true
		}
	}

	async function setStyle() {
		try {
			if(state._style != '') var style = JSON.parse(state._style)
			var style_str = state._style.replace(/\'/g, '##') // we must "quote"
			var style_str = style_str.replace(/\\"/g, '##') // we must "quote"
			await web.setNodeAttribute(store.current().data.id, {key:'_style', value: style_str})

		} catch(e) {
			alert('Style must be valid JSON!')
			console.log(e)
		}
	}

	async function setPublicity() {
		var result = await web.setNodeAttribute(store.current().data.id, {key:'_public', value: state._public})
	}

	async function createProperty() {
		if(editor.new_attr.key.startsWith('_')) {
			alert(`'_' is reserved for internal attributes`)
			return
		}
		try {
			await web.setNodeAttribute(store.current().data.id, editor.new_attr)
			editor.showNewAttributeEditor = false
			state.node = await web.getNodeAttributes(route.query.node)
			prepare()

		} catch(e) {
			alert('Attribute creation failed! ' + e)
			console.log(e)
		}
	}

	function prepare() {
		state.attributes = []
		if (state.node.length) {
			for(var attr of state.node) {
				for(var key of Object.keys(attr)) {
					if(key == '_public')
						state._public = attr[key]
					if(key == '_style') {
						var style = attr[key].replace(/##/g, "'" )
						state._style = JSON.stringify(JSON.parse(style),null,2)
					}
					if(!hidden_keys.includes(key))
						state.attributes.push({key: key, value: attr[key]})
				}
			}
		}
	}
</script>
