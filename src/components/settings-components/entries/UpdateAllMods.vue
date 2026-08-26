<script lang="ts" setup>
import { computed } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const outdatedCount = computed<number>(() => store.getters['profile/modsWithUpdates'].length);

const statusText = computed<string>(() =>
    outdatedCount.value === 1
        ? '1 mod has an update available.'
        : `${outdatedCount.value} mods have an update available.`
);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Update all mods',
    'Update'
]);

function updateAllMods() {
    store.commit('openUpdateAllModsModal');
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>更新所有模组</template>
        <template #description>
            快速将每个已安装的模组更新到最新版本。{{ statusText }}
        </template>
        <button
            class="button"
            :disabled="outdatedCount === 0"
            @click="updateAllMods"
        >
            更新所有模组
        </button>
    </SettingsViewWrapper>
</template>
