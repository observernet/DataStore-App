import { createRouter, createWebHistory } from 'vue-router'
import { useStore } from './store'

import Login from './pages/Login.vue';

import StoreLayout from './layouts/StoreLayout.vue';
import Purchase from './pages/Purchase.vue';
import History from './pages/History.vue';
import HistoryDetail from './pages/HistoryDetail.vue';
import Snap from './pages/Snap.vue';
import WStation from './pages/WeatherStation.vue';
import BigData from './pages/BigData.vue';

const routes = [
    {
        path: '/',
        redirect: '/store',
    },
    {
        path: '/login',
        component: Login,
    },
    {
        path: "/store",
        redirect: '/store/purchase',
        component: StoreLayout,
        children: [
            {
                path: "purchase",
                component: Purchase,
                meta: { requiresAuth: true }
            },
            {
                path: "history",
                component: History,
                meta: { requiresAuth: true }
            },
            {
                path: "history/detail/:id",
                component: HistoryDetail,
                meta: { requiresAuth: true }
            },
            {
                path: "snap",
                component: Snap,
                meta: { requiresAuth: true }
            },
            {
                path: "wstation",
                component: WStation,
                meta: { requiresAuth: true }
            },
            {
                path: "bigdata",
                component: BigData,
                meta: { requiresAuth: true }
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('./pages/NotFound.vue'), 
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach((to, from, next) =>
{    
    const store = useStore();
    if ( to.meta.requiresAuth && !store.isAuthenticated )
    {
        next({ path: '/login' });
    }
    else
    {
        next();
    }
});

export default router