<script lang="ts" setup>
import { computed, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import R2Error from '../../../model/errors/R2Error';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const activeExport = ref<'file' | 'code' | null>(null);
const isExporting = computed(() => activeExport.value !== null);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Export profile',
    'As file',
    'As code',
]);

async function exportProfile(as: 'file' | 'code', action: string) {
    if (isExporting.value) {
        return;
    }
    activeExport.value = as;
    try {
        await store.dispatch(action);
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e));
    } finally {
        activeExport.value = null;
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>导出配置</template>
        <template #description>
            导出你的模组列表和配置，以便与朋友分享，快速轻松地获得相同的配置。
        </template>
        <div class="setting-row">
            <button
                class="button"
                :class="{ 'is-loading': activeExport === 'file' }"
                :disabled="isExporting"
                @click="exportProfile('file', 'profileExport/exportProfileAsFile')"
            >
                作为文件
            </button>
            <button
                class="button"
                :class="{ 'is-loading': activeExport === 'code' }"
                :disabled="isExporting"
                @click="exportProfile('code', 'profileExport/exportProfileAsCode')"
            >
                作为代码
            </button>
        </div>
    </SettingsViewWrapper>
</template>
