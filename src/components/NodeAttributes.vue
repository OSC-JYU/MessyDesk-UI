<style>
	.attr-header {
		margin-top: 12px;
	}
	.attribute {
		margin-top:5px;
	}
</style>


<template>

	<div class="container" style="margin-bottom:40px">

		<!-- ATTRIBUTE EDITOR -->
		<template v-if="props.editing ">

			<div class="attr-header" v-for="attr of state.attributes" :key="attr.key">
				<template v-if="!attr.key.startsWith('_')">
					<div ><i @click="editField(attr)" class="bi-pen pointer float-end" style="color: blue;"></i></div>
					<label><b>{{attr.key}}</b>
					</label>
					<div>{{attr.value}}</div>

					<!-- editor -->

					<template v-if="state.current_field.key == attr.key">
						<textarea v-if="['description', 'query'].includes(state.current_field.key)" v-model="state.current_field.value" class="form-control" id="editorInput" rows="3"></textarea>
						<input v-else v-model="state.current_field.value">
						<button @click="editField(attr)"  class="btn btn-secondary">cancel</button>
						<button @click="saveField()" class="btn btn-primary">save</button>
					</template>
					<!-- editor ends -->

				</template>
			</div>
		</template>
		<!-- ATTRIBUTE EDITOR ENDS -->


		<!-- ATTRIBUTE DISPLAY -->
		<template v-else>
			<div class="attribute" v-for="attr of state.attributes" :key="attr.key">
				<!-- do not show system attributes or empty attributes -->
				<template v-if="!attr.key.startsWith('_') && attr.value != ''">
					<div><i>{{attr.key.replace('URL_','').replace('URL','')}}</i></div>
					<a v-if="attr.key.toLowerCase().includes('url')" :title= "attr.key" :href="attr.value" target="_BLANK">link</a>

					<div v-else>
						<!--<div><i>{{attr.key}}</i></div>-->
						<b>{{attr.value}}</b></div>
				</template>
			</div>
		</template>
		<!-- ATTRIBUTE DISPLAY ENDS -->

		<!-- REPOSITORY SPECIFIC CODE -->
		<div v-if="state.node.length && state.node[0]['@type'] == 'Repository'">
			<button @click="getCommits()" class="btn btn-secondary float-end">show commits</button>
			<div class="container" style="margin-top:20px">
				<div v-for="c of state.commits" :key="c.url">
					<a :href="c.url" target="_BLANK">{{c.title}}</a> ({{c.author}}) {{c.date}}
				</div>
			</div>
		</div>
		<!-- REPOSITORY SPECIFIC CODE ENDS -->

		<!-- DOCKER SPECIFIC CODE -->
		<div v-if="state.node.length && state.node[0]['@type'] == 'Container'">
			<div class="container" style="margin-top:20px" v-if="state.inspect.State">
				<table class="table">
					<tbody>
						<tr>
							<th scope="row">Path</th>
							<td>{{state.inspect.Path}}</td>
						</tr>
						<tr>
							<th scope="row">Status</th>
							<td>{{state.inspect.State.Status}}</td>
						</tr>
						<tr>
							<th scope="row">RestartCount</th>
							<td>{{state.inspect.RestartCount}}</td>
						</tr>
						<tr>
							<th scope="row">StartedAt</th>
							<td>{{state.inspect.State.StartedAt.split('.')[0]}}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<!-- DOCKER SPECIFIC CODE ENDS -->
		<hr>
	</div>
</template>


<script setup>
	import { onMounted, watch, reactive, ref} from "vue";
	import { useRoute } from 'vue-router'
	import {store} from "./Store.js";
	import web from "../web.js";

	const route  = useRoute();
	var editing = ref(false)
	var state = reactive({
		node:[],
		attributes:[],
		commits:[],
		inspect: {},
		_group: '',
		_access: '',
		current_field: {key:'', value:''}
	})
	const hidden_keys = ['label', '@rid', '@type', 'parent', 'id', 'group']
	const emit = defineEmits(['reLoadData'])

	const props = defineProps({
		editing: false,
		attributes: {}
	})

	watch(() => props.attributes, async (newValue, oldValue) => {
		if(newValue) {
			prepare()
			await getInspect()
		}
	})

	onMounted(async()=> {
		if(route.query.node)
			prepare()
			await getInspect()
	})

	function editable() {
        if(store.current().data.id == '#' + route.query.node) {
            if(store.current().data.id == store.user.rid || store.user.access == 'admin')
                return true
        }
        return false
    }

	function editField(field) {
		if(state.current_field.key == field.key) {
			state.current_field.key = ''
		} else {
			state.current_field.key = field.key
			state.current_field.value = field.value
		}
	}

	async function saveField() {
		await web.setNodeAttribute(store.current().data.id, state.current_field)
		state.current_field.key = ''
		emit('reLoadData', route.query.node)
		//prepare()
	}

	async function saveUserSetting(key) {
		await web.setNodeAttribute(store.current().data.id, {key: key, value: state[key]})
		prepare()
	}

	async function setActive() {
        var result = await web.setNodeAttribute(store.current().data.id, {key:'_active', value: state.active})
        store.reload()
    }


	async function setAdmin() {
		console.log('admin')
	}

	async function getCommits() {
		state.commits = await web.getGitlabCommits(state.node[0].id)
	}

	async function getInspect() {
		if(state.node.length && state.node[0]['@type'] == 'Container')
			state.inspect = await web.getDockerContainerInspect(state.node[0].id)
	}

	function prepare() {
		state.commits = []
		state.inspect = {}
		state.logs = []
		state.attributes = []
		if (props.attributes) {
			for(var key in props.attributes) {
				if(!hidden_keys.includes(key))
					state.attributes.push({key: key, value: props.attributes[key]})
				if(key == '_group')
					state._group = props.attributes[key]
				if(key == '_access')
					state._access = props.attributes[key]
			}
			// make sure setting 'description' is possible
			 if(!Object.keys(props.attributes).includes('description'))
			 	state.attributes.push({key: 'description', value: ''})
		}
	}
</script>
