<script lang="ts" setup>
import { computed, ref } from 'vue';
import moment from 'moment';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const isRefreshing = computed<boolean>(() => store.state.tsMods.isThunderstoreModListUpdateInProgress);
const hasActiveDownloads = computed<boolean>(() => store.getters['download/activeDownloadCount'] > 0);
const isCleaning = ref<boolean>(false);

const status = computed<string>(() => {
    if (isRefreshing.value) {
        return store.state.tsMods.thunderstoreModListUpdateStatus || '刷新中...';
    }
    if (store.state.tsMods.thunderstoreModListUpdateError) {
        return `刷新模组列表时出错：${store.state.tsMods.thunderstoreModListUpdateError.message}`;
    }
    if (hasActiveDownloads.value) {
        return '有正在进行的下载时，无法刷新模组列表。';
    }
    if (store.state.tsMods.modsLastUpdated !== undefined) {
        return '上次更新于：' + moment(store.state.tsMods.modsLastUpdated).format('YYYY年MM月DD日 HH:mm:ss');
    }
    return '暂无 API 信息';
});

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Refresh online mod list',
    'Check for new mod releases',
    'Clean online mod list cache',
    'Reset mod list cache',
]);

async function refresh() {
    if (isRefreshing.value || hasActiveDownloads.value) {
        return;
    }
    await store.dispatch('tsMods/syncPackageList');
}

async function cleanCache() {
    if (isRefreshing.value || isCleaning.value) {
        return;
    }
    isCleaning.value = true;
    try {
        await store.dispatch('tsMods/resetActiveGameCache');
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, '清除在线模组列表失败'));
    } finally {
        isCleaning.value = false;
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>在线模组列表</template>
        <template #description>
        <p>
            检查新的模组版本，或清除本地副本。
        </p>
        <p>{{ status }}</p>
        </template>
        <div class="setting-row">
            <button
                class="button"
                :class="{ 'is-loading': isRefreshing && !isCleaning }"
                :disabled="isRefreshing || hasActiveDownloads"
                @click="refresh"
            >
                刷新
            </button>
            <button
                class="button"
                :class="{ 'is-loading': isCleaning }"
                :disabled="isRefreshing || isCleaning"
                @click="cleanCache"
            >
                删除副本
            </button>
        </div>
    </SettingsViewWrapper>
</template>
