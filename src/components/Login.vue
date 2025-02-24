
<template>
    <div id="app">
        <v-container fill-height>
            <v-row align="center" justify="center">
                <v-col cols="12" sm="8" md="4">
                    <v-card class="elevation-12">
                        <v-img
                        height="200px"
                        :src="Bg"
                      
                        ></v-img>
                                        
                        <v-card-title>
                        MessyDesk
                        </v-card-title>
                        
                        <v-chip class="tex-align-center, ma-5" color="primary"> {{ state.user.mail }} </v-chip>
                        <v-chip class="tex-align-center, ma-5"> {{ state.user.name }} </v-chip>
                        
                        <v-card-text >
                            <v-alert type="warning">{{ $t('register.not_registered') }}</v-alert>
                        </v-card-text>

                        <v-card-subtitle class="text-wrap">
                            {{ $t('register.organisation') }}
                        </v-card-subtitle>

                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn v-if="!state.success" color="primary" @click="sendRequest()">LÄHETÄ PYYNTÖ</v-btn> 
                        </v-card-actions>
                        <v-alert v-if="state.error && !state.success" type="danger">{{ $t('register.request_error') }}</v-alert>
                        <v-alert v-if="state.success" type="success">{{ $t('register.request_success') }}</v-alert>



                    </v-card>
                    <v-img class="mt-8"
                        height="100px"
                        :src="Org"
                        ></v-img>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>


<script setup>

    import { onMounted, reactive } from 'vue'
    import web from "../web.js";
    import Bg from '@/assets/images/not_registered.jpg';
    import Org from '@/assets/images/organisation.png';

    const state = reactive({
        user: {mail: '', name: ''},
        success: false,
        error: ''
    })

    async function sendRequest() {
        try {
            await web.addPermissionRequest()
            state.success = true
        } catch (error) {
            state.error = 'Request failed!'
            console.log(error.status)
        }
    }

    onMounted(async() => {
        var response = await fetch('/api/sso')
        state.user = await response.json()
    })
</script>