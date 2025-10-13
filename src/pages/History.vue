<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from "@/store"
import comm from '@/comm'
import utils, { toast }  from "@/utils"


const router = useRouter();
const store = useStore();


const apiList = ref(null);


function onClickData(id) {
	router.push(`/store/history/detail/${id}`);
}

async function onClickDownload(purchaseID) {
	try {
        const response = await comm.RequestFILE(store.lang, "/download", {
            purchaseID: purchaseID,
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

async function requestPurchaseList() {
    try {
        const result = await comm.RequestGET(store.lang, "/purchase/list", {
            account: store.user.account,
        });
		apiList.value = result.list;
        console.log('requestPurchaseList:', apiList.value);

    } catch (err) {
        console.error("requestPurchaseList error:", err);
    }
}

onMounted(() => requestPurchaseList());
</script>

<template>
    <div class="whistory">
        <div class="title">{{ $t('history.title') }}</div>
		<div class="body">
			<div class="content">
				<!--div class="move">
					<img src="@/assets/images/left.svg" width="24" height="24" />
					<div class="page">1 / 99</div>
					<img src="@/assets/images/right.svg" width="24" height="24" />
				</div-->
				<div class="table">
					<table>
						<thead>
							<tr>
								<th>{{ $t('history.table.date') }}</th>
								<th>{{ $t('history.table.type') }}</th>
								<th>{{ $t('history.table.amount') }}</th>
								<th>{{ $t('history.table.txid') }}</th>
								<th>{{ $t('history.table.status') }}</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="item in apiList" :key="item.purchaseID" @click="onClickData(item.purchaseID)">
								<td>{{ utils.formatSingleDate(item.time) }}</td>
								<td>{{ store.getDatatypeByType(item.data_type)?.name }}</td>
								<td>{{ utils.formatNumber(item.amount) }} OBSR</td>
								<td>{{ utils.formatTxHash(item.txid) }}</td>
								<td>
									<button class="download" @click.stop="onClickDownload(item.purchaseID)" v-if="item.status == 'V'">
										<img src="@/assets/images/download.svg" width="16" height="16" />
										Download
									</button>
									<button v-else-if="item.status == 'X'">
										<img src="@/assets/images/check_good.svg" width="16" height="16" />
										Download Complete
									</button>
									<button class="prepare" v-else-if="item.status == 'Z'">
										<img src="@/assets/images/prepare.svg" width="16" height="16" />
										Error
									</button>
									<button class="prepare" v-else>
										<img src="@/assets/images/prepare.svg" width="16" height="16" />
										Preparing data...
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<!--div class="move">
					<img src="@/assets/images/left.svg" width="24" height="24" />
					<div class="page">1 / 99</div>
					<img src="@/assets/images/right.svg" width="24" height="24" />
				</div-->
			</div>
		</div>
    </div>
</template>

<style scoped>
.whistory { position: relative; height: 100%; display: flex; flex-direction: column; }
.whistory .title { padding: 15px; border-bottom: 0.5px solid #DBE4EB; font-size: 20px; font-weight: 700; background: #FFF; }
.whistory .body { flex: 1; display: flex; min-height: 0; overflow-y: auto; }

.whistory .body .content { position: relative; width: 100%; margin: 24px; padding: 24px 16px; background: #FFF; border-radius: 8px; align-self: flex-start; }
.whistory .body .content .move { display: flex; justify-content: end; align-items: center; gap: 4px; margin: 12px 8px; }
.whistory .body .content .move .page { background: #F5F7FA; border-radius: 8px; padding: 8px 16px; font-size: 16px; font-weight: 500; color: #22262A; line-height: 100%; }
.whistory .body .content .table { border: 1px solid #DBE4EB; border-radius: 8px; overflow: hidden; }
.whistory .body .content .table table { width: 100%; border-collapse: collapse; font-size: 14px; font-weight: 500; }
.whistory .body .content .table thead { background: #F5F7FA; border-bottom: 1px solid #DBE4EB; }
.whistory .body .content .table thead th { padding: 12px 16px; color: #40484E; text-align: center; width: 20%; }
.whistory .body .content .table thead th:last-child { width: 20.8%; }
.whistory .body .content .table tbody tr { border-bottom: 1px solid #DBE4EB; cursor: pointer; }
.whistory .body .content .table tbody tr:last-child { border-bottom: none; }
.whistory .body .content .table tbody td { padding: 12px 16px; color: #40484E; text-align: center; }
.whistory .body .content .table tbody td:last-child { width: 20%; }
.whistory .body .content .table tbody td button { background: #E5EBF0; padding: 6px 12px; font-size: 12px; font-weight: 500; color: #22262A; gap: 4px; width: 100%; }
.whistory .body .content .table tbody td button.prepare { background: #22262A; color: #FFF; }
.whistory .body .content .table tbody td button.download { background: #0098E3; color: #FFF; }
</style>