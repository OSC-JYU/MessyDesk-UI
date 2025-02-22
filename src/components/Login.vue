
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
                        
                        
                        <v-card-subtitle class="text-wrap">
                            {{ $t('register.organisation') }}
                        </v-card-subtitle>
                        
                        <v-chip class="tex-align-center, ma-5"> {{ state.mail }} </v-chip>
                        
                        <v-card-text>
                            {{ $t('register.not_registered') }}
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <!-- <v-btn color="primary" @click="sendRequest()">LÄHETÄ PYYNTÖ</v-btn> -->
                        </v-card-actions>
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
    import Bg from '@/assets/images/not_registered.jpg';
    import Org from '@/assets/images/organisation.png';

    const state = reactive({
        mail: ''
    })

    onMounted(async() => {
        var response = await fetch('/api/sso')
        state.mail = await response.text()
    })
</script>