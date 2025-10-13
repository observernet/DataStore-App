<script setup>
import { ref, onMounted, onBeforeUnmount, onBeforeMount } from "vue";
import { useI18n } from "vue-i18n";
import { useStore } from "@/store";
import { emitter } from "./emitter";


const { locale } = useI18n();
const store = useStore();
const is_loading = ref(false);


function onShowLoading() {
    is_loading.value = true;
}

function onHideLoading() {
    is_loading.value = false;
}


let accountsChangedHandler;

onBeforeMount(() => {
    //const lang = store.loadLocale() || 'en';
    const lang = 'en';
	locale.value = lang;

    store.loadUser();
	store.loadDataType();
	store.fetchDataType();
});

onMounted(() => {
    emitter.on("show-loading", onShowLoading);
    emitter.on("hide-loading", onHideLoading);

    if ( window.ethereum ) {
    	accountsChangedHandler = (accounts) => {
      		console.log("accountsChanged", accounts);
            if ( accounts.length == 0 ) {
                store.logout();
            }
    	};
    	window.ethereum.on("accountsChanged", accountsChangedHandler);
  	}
});

onBeforeUnmount(() => {
    if ( window.ethereum && accountsChangedHandler ) {
    	window.ethereum.removeListener("accountsChanged", accountsChangedHandler);
  	}

    emitter.off("show-loading", onShowLoading);
    emitter.off("hide-loading", onHideLoading);
});
</script>

<template>
    <div class="container">
        <router-view v-slot="{ Component, route }">
            <transition :name="route.meta.transition">
                <component :is="Component" />
            </transition>
        </router-view>

        <div class="pcircle" v-if="is_loading">
            Loading...
        </div>
    </div>
</template>

<style scoped>
.pcircle { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.5); }
</style>