<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from "@/store"
import { useI18n } from 'vue-i18n'
import { toast } from "@/utils"

const route = useRoute();
const router = useRouter();
const store = useStore();
const { locale } = useI18n();

const isCollapsed = ref(false);
const selectedLang = ref(locale.value);


function movePage(path) {
    if ( route.path !== path ) {
	    router.push(path);
    }
}

function toggleMenu() {
  isCollapsed.value = !isCollapsed.value;
}

function onClickSignout() {
    store.logout();
    router.replace('/login');
}

function gotoHome() {
    window.location.href = 'https://datastore.obsr.org/';
}

function changeLanguage() {
    locale.value = selectedLang.value;
    store.changeLocale(selectedLang.value);
}
</script>

<template>
    <div class="layout">
        <div class="left" :class="{ collapsed: isCollapsed }">
            <div class="top">
                <div class="logo" v-if="!isCollapsed" @click="gotoHome()">
                    <img src="@/assets/images/logo.svg" width="20" height="20" />
                    <span v-if="!isCollapsed">DataStore</span>
                </div>
                <img src="@/assets/images/menu_close.svg" width="24" height="24" style="cursor: pointer;" @click="toggleMenu" v-if="!isCollapsed" />
                <img src="@/assets/images/menu_open.svg" width="24" height="24" style="cursor: pointer;" @click="toggleMenu" v-if="isCollapsed" />
            </div>
            <ul>
                <li :class="{hover: route.path.startsWith('/store/purchase')}" @click="movePage('/store/purchase')">
                    <img src="@/assets/images/purchase.svg" width="24" height="24" />
                    <span v-if="!isCollapsed">{{ $t('menu.purchase') }}</span>
                </li>
                <li :class="{hover: route.path.startsWith('/store/snap')}" @click="movePage('/store/snap')">
                    <img src="@/assets/images/sky_photo.svg" width="24" height="24" />
                    <span v-if="!isCollapsed">{{ $t('menu.snap') }}</span>
                </li>
                <li :class="{hover: route.path.startsWith('/store/wstation')}" @click="movePage('/store/wstation')">
                    <img src="@/assets/images/ws.svg" width="24" height="24" />
                    <span v-if="!isCollapsed">{{ $t('menu.wstation') }}</span>
                </li>
                <li :class="{hover: route.path.startsWith('/store/bigdata')}" @click="movePage('/store/bigdata')">
                    <img src="@/assets/images/bulkdata.svg" width="24" height="24" />
                    <span v-if="!isCollapsed">{{ $t('menu.bigdata') }}</span>
                </li>
                <li :class="{hover: route.path.startsWith('/store/history')}" @click="movePage('/store/history')">
                    <img src="@/assets/images/history.svg" width="24" height="24" />
                    <span v-if="!isCollapsed">{{ $t('menu.history') }}</span>
                </li>
            </ul>
            <div class="signout" @click="onClickSignout()">
                <img src="@/assets/images/signout.svg" width="24" height="24" />
                <span v-if="!isCollapsed">Sign Out</span>
            </div>
            <!--div class="language-box" v-if="!isCollapsed">
                <select v-model="selectedLang" @change="changeLanguage">
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                </select>
            </div-->
        </div>
        <div class="content">
            <router-view />
        </div>
    </div>
</template>

<style scoped>
.layout { position: absolute; top: 0; left: 0; right: 0; height: 100%; display: flex; }
.layout .left { width: 260px; background: #22262A; display: flex; flex-direction: column; }
.layout .left.collapsed { width: 70px; }
.layout .left img { padding-right: 8px; }
.layout .left .top { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; padding-right: 12px; border-bottom: 1px solid #2C3136; }
.layout .left .top .logo { display: flex; align-items: center; }
.layout .left .top .logo span { font-size: 18px; font-weight: 700; color: #FFF; }
.layout .left ul { flex: 1; padding: 24px 12px; list-style: none; }
.layout .left ul li { display: flex; align-items: center; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.layout .left ul li span { font-size: 14px; font-weight: 500; color: #FFF; }
.layout .left ul li.hover { background: rgba(133, 147, 156, 0.15); }
.layout .left .signout { display: flex; align-items: center; padding: 24px; cursor: pointer; }
.layout .left .signout span { font-size: 14px; font-weight: 500; color: #FFF; }
.layout .content { flex: 1; }

.language-box { padding: 12px 24px 32px 24px; }
.language-box select { width: 100%; padding: 6px 8px; border-radius: 6px; border: none; background: #2C3136; color: #FFF; font-size: 14px; font-weight: 500; outline: none; }

.layout .left {
  transition: width 0.3s ease;
  overflow: hidden;
}

.layout .left .top .logo span,
.layout .left ul li span,
.layout .left .signout span {
  opacity: 1;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.layout .left.collapsed .top .logo span,
.layout .left.collapsed ul li span,
.layout .left.collapsed .signout span {
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
}
</style>