<template>

	<!-- Modal -->
	<div v-if="store.search_open" class="modal modal-lg fade show" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" style="display:block">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
						Search <v-btn @click="store.search_open = false" icon ><v-icon>mdi-close</v-icon></v-btn>
				</div>


				
				<div class="modal-body">

					<v-container  fluid>
						<v-row  >

					

						<v-col
							class=""
							cols="12"
							color="light-blue lighten-3"
						>
							<!-- Second column content -->
							<v-container>

								<v-text-field v-model="state.search" @keydown.enter="search()" label="Search"></v-text-field>
								<v-btn @click="search()">Search</v-btn>


								
								<template v-if="state.result.response">
									<!-- {{ state.result.response.docs}} -->
								<v-card v-for="item in state.result.response.docs" :key="item" class="mt-2">
									<v-card-title ><router-link :to="'graph?node=217:20&focus=258:264'" title="search"><v-icon>mdi-magnify</v-icon></router-link>
									<div @click="go(item.id)">{{item.node}}  ({{item.type}}) {{item.label}} </div>
									</v-card-title>
									<v-card-subtitle v-if="item.description">{{ item.description.replace('\n', '') }}</v-card-subtitle> 
									<v-card-text v-if="state.result.highlighting[item.id]" v-html="state.result.highlighting[item.id].fulltext"></v-card-text>
								</v-card>

								</template>
							</v-container>
							</v-col>


						</v-row>
          </v-container>					
				
				</div>


				<div class="modal-footer">
					

				</div>

			</div>
		</div>
	</div>

</template>


<script setup>
    import { onMounted, onActivated, watch, reactive, ref} from "vue";
	import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

	const router = useRouter();
	const route = useRoute();



    var state = reactive({
        search: "",
        result: []
    })

    async function search() {
        state.result = await web.search(state.search)
    }


</script>
