<script lang="ts" setup>
import { computed, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import { SteamInstallationValidator } from '../../../r2mm/manager/SteamInstallationValidator';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const activeGame = computed(() => store.state.activeGame);
const isValidating = ref<boolean>(false);

const { isVisible } = useSettingSearch(() => props.searchTerm, () => [
    `Reset ${activeGame.value.displayName} installation`,
    'Validate installation',
    'Verify integrity',
    'Corrupted files',
]);

async function validateSteamInstallation() {
    isValidating.value = true;
    const res = await SteamInstallationValidator.validateInstallation(activeGame.value);
    isValidating.value = false;
    if (res instanceof R2Error) {
        store.commit('error/handleError', res);
    } else {
        store.commit('openSteamInstallationValidationModal');
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>重置 {{ activeGame.displayName }} 安装</template>
        <template #description>
            修复由损坏文件或手动修改尝试遗留的文件所导致的问题。
            这将删除 <code class="code">{{ activeGame.steamFolderName }}</code> 文件夹中的所有内容，
            并通过 Steam 验证文件。
        </template>
        <button
            class="button"
            :class="{ 'is-loading': isValidating }"
            :disabled="isValidating"
            @click="validateSteamInstallation"
        >
            重置安装
        </button>
    </SettingsViewWrapper>
</template>
