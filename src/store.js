import { defineStore } from "pinia";
import comm from '@/comm';

export const useStore = defineStore("store", {
    state: () => ({
        user: null,
        lang: 'ko',
        nation_time: 0,
        nation: [],
        datatype_time: 0,
        datatype: [],
        network: {
            name: 'Kaia Mainnet',
            rpc: 'https://public-en.node.kaia.io',
            chainId: '0x2019',
            symbol: 'KAIA',
            explorer: 'https://kaiascan.io',
        },
        /*network: {
            name: 'Kaia Kairos Testnet',
            rpc: 'https://public-en-kairos.node.kaia.io',
            chainId: '0x3e9',
            symbol: 'KAIA',
            explorer: 'https://kairos.kaiascan.io',
        },*/
    }),
    getters: {
        isAuthenticated: (state) => !!state.user,
        getDatatypeByType: (state) => {
            return (type) => state.datatype.find(d => d.type === type) || null
        },
        getDataInfo: (state) => {
            return (type, code) => {
                const datatype = state.datatype.find(d => d.type === type);
                if ( !datatype || !Array.isArray(datatype.datas) ) return null;

                const data = datatype.datas.find(item => item.code === code);
                return data || null;
            };
        },
        getNationByCode: (state) => {
            return (code) => state.nation.find(d => d.code === code) || null
        },
    },
    actions: {
        login(user) {
            this.user = user;

            localStorage.setItem("login", btoa(JSON.stringify({
                user: this.user,
                expire: Date.now() + (7 * 24 * 60 * 60 * 1000),
            })));
        },
        logout() {
            this.user = null;
            localStorage.removeItem("login");
        },
        changeLocale(lang) {
            this.lang = lang;
            localStorage.setItem("lang", lang);
        },
        async fetchDataType() {
            try {
                const data = await comm.RequestGET(this.lang, "/datatype", {nc_time: this.nation_time, dt_time: this.datatype_time});
                this.nation_time = data.nc_time || this.nation_time;
                this.datatype_time = data.dt_time || this.datatype_time;
                if ( data.datatype ) this.datatype = data.datatype;
                if ( data.nation ) this.nation = data.nation;

                localStorage.setItem("dataType", JSON.stringify({
                    nation_time: this.nation_time,
                    nation: this.nation,
                    datatype_time: this.datatype_time,
                    datatype: this.datatype,
                }));
            } catch (err) {
                console.error("fetchDataType error:", err);
                this.datatype = [];
                this.nation = [];
                throw err;
            }                
        },
        loadDataType() {
            const saved = localStorage.getItem("dataType");
            if ( !saved ) return;

            try {
                const parsed = JSON.parse(saved);
                this.nation_time = parsed.nation_time || 0;
                this.nation = parsed.nation || [];
                this.datatype_time = parsed.datatype_time || 0;
                this.datatype = parsed.datatype || [];
            } catch (err) {
                console.error("loadDataType error:", err);
            }
        },
        loadUser() {
            try {
                const saved = localStorage.getItem("login");
                if ( !saved ) return;

                const decoded = JSON.parse(atob(saved));
                if ( Date.now() > decoded.expire ) {
                    localStorage.removeItem("login");
                    return;
                }

                this.user = decoded.user;
            } catch (err) {
                console.error("loadUser error:", err);
                localStorage.removeItem("login");
            }
        },
        loadLocale() {
            try {
                const saved = localStorage.getItem("lang");
                if ( !saved ) return null;

                this.lang = saved;
                return saved;
            } catch (err) {
                console.error("loadLocale error:", err);
                return null;
            }
        }
    },
});
