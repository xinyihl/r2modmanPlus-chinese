<script lang="ts" setup>
import { computed, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import CacheUtil from '../../../r2mm/mods/CacheUtil';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const cacheEnabled = computed<boolean>(() => !store.state.download.ignoreCache);
const isCleaning = ref<boolean>(false);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Mod cache',
    'Download cache',
    'Reuse cached downloads',
    'Toggle',
    'Clean mod cache',
    'Free space',
]);

async function toggleCache() {
    await store.dispatch('download/toggleIgnoreCache');
}

async function cleanCache() {
    isCleaning.value = true;
    try {
        await CacheUtil.clean();
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, 'Failed to clean the mod cache'));
    } finally {
        isCleaning.value = false;
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>模组缓存</template>
        <template #description>
            已下载的模组会保存在缓存中，无需重复下载。
        </template>
        <div class="setting-column">
            <div class="field" @click.prevent.stop="toggleCache">
                <input
                    id="toggle-download-cache"
                    type="checkbox"
                    :class="['switch', { 'is-info': cacheEnabled }]"
                    :checked="cacheEnabled"
                />
                <label for="toggle-download-cache">
                    {{ cacheEnabled ? '已启用' : '已禁用' }}
                </label>
                <p class="setting-hint" @click.stop.prevent>{{ cacheEnabled ? '复用缓存的下载（推荐）' : '下载模组时忽略缓存。每次都会重新下载。' }}</p>
                <p class="setting-hint" v-if="!cacheEnabled" @click.stop.prevent>模组仍会写入缓存，并继续占用磁盘空间。</p>
            </div>
            <div class="setting-row">
                <button
                    class="button"
                    :class="{ 'is-loading': isCleaning }"
                    :disabled="isCleaning"
                    @click="cleanCache"
                >
                    清除缓存
                </button>
                <span class="setting-hint">删除不在任何配置中的缓存模组以释放存储空间。</span>
            </div>
        </div>
    </SettingsViewWrapper>
</template>
