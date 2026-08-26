<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../../components/composables/SettingSearchComposable';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const isCleaning = ref<boolean>(false);
const cacheStatus = ref<string>('');

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Clean online mod list cache',
    'Reset mod list cache',
    'Clean',
]);

async function refreshStatus() {
    try {
        cacheStatus.value = await store.dispatch('tsMods/getActiveGameCacheStatus');
    } catch (e) {
        cacheStatus.value = '';
    }
}

onMounted(refreshStatus);

async function cleanOnlineModList() {
    isCleaning.value = true;
    try {
        await store.dispatch('tsMods/resetActiveGameCache');
        await refreshStatus();
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, 'Failed to clean the online mod list'));
    } finally {
        isCleaning.value = false;
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>清除在线模组列表缓存</template>
        <template #description>
            删除模组列表的本地副本并重新获取。
            <template v-if="cacheStatus">{{ cacheStatus }}</template>
        </template>
        <button
            class="button"
            :class="{ 'is-loading': isCleaning }"
            :disabled="isCleaning"
            @click="cleanOnlineModList"
        >
            清除在线模组列表
        </button>
    </SettingsViewWrapper>
</template>
