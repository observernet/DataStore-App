<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from "@/store"
import comm from '@/comm'
import utils, { toast }  from "@/utils"


const icons = import.meta.glob("@/assets/images/data/*.svg", { eager: true, import: "default" })
const route = useRoute();
const store = useStore();


const apiResult = ref(null);


function getCityName(code) {
    const parts = code.split('_');
    if ( parts.length != 2 ) return '-';

    const nation = store.getNationByCode(parts[0]);
    if ( nation == null || nation.cities == 0 || nation.cities.length == 0 ) return '-';

    const city = nation.cities.find(d => d.code === parts[1]);
    return city.name;
}

function getIcon(code) {
	return icons[`/src/assets/images/data/${code}.svg`] || icons[`/src/assets/images/data/TMP.svg`]
}

async function onClickDownload() {
	try {
        const response = await comm.RequestFILE(store.lang, "/download", {
            purchaseID: route.params.id,
        });

        if ( !response || !response.data ) {
            console.error("Invalid file response");
            return;
        }
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });

        let filename = 'downloaded_file';
        const disposition = response.headers['content-disposition'];
        if ( disposition ) {
            const match = disposition.match(/filename="?([^"]+)"?/);
            if (match) filename = decodeURIComponent(match[1]);
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("onClickDownload error:", err);
		toast.error(err.error.message);
    }
}

async function requestPurchaseDetail() {
    try {
        const result = await comm.RequestGET(store.lang, "/purchase/detail", {
            purchaseID: route.params.id,
        });
        apiResult.value = result;
        console.log('requestPurchaseDetail:', result);

    } catch (err) {
        console.error("requestPurchaseDetail error:", err);
    }
}

onMounted(() => requestPurchaseDetail());
</script>

<template>
    <div class="wdetail">
        <div class="title">{{ $t('history.title') }}</div>
		<div class="body">
			<div class="content" v-if="apiResult">
                <h3>{{ $t('history.detail.title') }}</h3>
				<ul>
                    <li>
						<strong>{{ $t('history.detail.date') }}</strong>
						<span>{{ utils.formatSingleDate(apiResult.time) }}</span>
					</li>
					<li>
						<strong>{{ $t('history.detail.type') }}</strong>
						<span>{{ store.getDatatypeByType(apiResult.data_type)?.name }}</span>
					</li>
					<li>
						<strong>{{ $t('history.detail.txid') }}</strong>
                        <span>{{ apiResult.txid }}</span>
					</li>
                    <li>
						<strong>{{ $t('history.detail.nation') }}</strong>
                        <ul class="chips">
                            <li v-for="code in apiResult.cities" :key="code">
                                {{ getCityName(code) }}
                            </li>
                        </ul>
					</li>
					<li>
						<strong>{{ $t('history.detail.period') }}</strong>
						<div style="display: flex; gap: 12px;">
							<span>{{ utils.formatSingleDate(utils.parseDate(apiResult.start)) }} ~ {{ utils.formatSingleDate(utils.parseDate(apiResult.end)) }}</span>
							<span>{{ $t('history.detail.days', utils.diffDays(apiResult.start, apiResult.end)) }}</span>
						</div>
					</li>
				</ul>
				<div class="table">
					<table>
						<thead>
							<tr>
								<th>{{ $t('history.detail.datas') }}</th>
								<th>{{ $t('history.detail.amount') }}</th>
							</tr>
						</thead>
                        <tbody>
                            <tr v-for="item in apiResult.datas" :key="item.code">
                                <td style="display: flex; align-items: center; gap: 6px;">
                                    <img :src="getIcon(item.code)" width="24" height="24" />
                                    {{ store.getDataInfo(apiResult.data_type, item.code)?.name }}
                                </td>
                                <td>{{ utils.formatNumber(item.amount) }} OBSR</td>
                            </tr>
                        </tbody>
						<tfoot>
							<tr>
								<td>{{ $t('history.detail.sum') }}</td>
								<td>{{ utils.formatNumber(apiResult.amount) }} OBSR</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<button class="download" @click="onClickDownload()" v-if="apiResult.status == 'V'">
                    <img src="@/assets/images/download.svg" width="16" height="16" />
                    Download
                </button>
                <button v-else-if="apiResult.status == 'X'">
                    <img src="@/assets/images/check_good.svg" width="16" height="16" />
                    Download Complete
                </button>
                <button class="prepare" v-else-if="apiResult.status == 'Z'">
                    <img src="@/assets/images/prepare.svg" width="16" height="16" />
                    Error
                </button>
                <button class="prepare" v-else>
                    <img src="@/assets/images/prepare.svg" width="16" height="16" />
                    Preparing data...
                </button>
            </div>
		</div>
    </div>
</template>

<style scoped>
.wdetail { position: relative; height: 100%; display: flex; flex-direction: column; }
.wdetail .title { padding: 15px; border-bottom: 0.5px solid #DBE4EB; font-size: 20px; font-weight: 700; background: #FFF; }
.wdetail .body { flex: 1; display: flex; min-height: 0; overflow-y: auto; }

.wdetail .body .content { position: relative; margin: 24px auto; padding: 24px 16px; background: #FFF; border-radius: 8px; width: 100%; max-width: 950px; align-self: flex-start; }
.wdetail .body .content h3 { margin-bottom: 16px; }
.wdetail .body .content ul { list-style: none; }
.wdetail .body .content ul li:not(.chips li) { display: flex; justify-content: space-between; border-bottom: 1px solid #DBE4EB; padding: 12px 0; }
.wdetail .body .content ul li strong { display: block; font-size: 14px; font-weight: 500; color: #40484E; }
.wdetail .body .content ul li span { display: block; font-size: 14px; font-weight: 500; color: #40484E; }
.wdetail .body .content ul li:not(.chips li):last-child { border-bottom: none; }

.wdetail .body .content .table { margin-top: 24px; border: 1px solid #DBE4EB; border-radius: 8px; overflow: hidden; }
.wdetail .body .content .table table { width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 500; }
.wdetail .body .content .table thead { background: #F5F7FA; border-bottom: 1px solid #DBE4EB; }
.wdetail .body .content .table thead th { padding: 12px 16px; color: #40484E; text-align: left; }
.wdetail .body .content .table thead th:last-child { text-align: right; }
.wdetail .body .content .table tbody tr { border-bottom: 1px solid #DBE4EB; }
.wdetail .body .content .table tbody td { padding: 12px 16px; color: #40484E; }
.wdetail .body .content .table tbody td:last-child { color: #22262A; text-align: right; }
.wdetail .body .content .table tfoot tr { background: #40484E; }
.wdetail .body .content .table tfoot td { padding: 12px 16px; color: #FFF; font-size: 16px; font-weight: 600; }
.wdetail .body .content .table tfoot td:last-child { text-align: right; }

.wdetail .body .content button { background: #E5EBF0; color: #22262A; gap: 4px; width: 100%; margin-top: 60px; padding: 12px 16px; }
.wdetail .body .content button.prepare { background: #22262A; color: #FFF; }
.wdetail .body .content button.download { background: #0098E3; color: #FFF; }

</style>