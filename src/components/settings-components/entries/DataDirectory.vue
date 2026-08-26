<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import PathResolver from '../../../r2mm/manager/PathResolver';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import LinkProvider from '../../../providers/components/LinkProvider';
import { DataFolderProvider } from '../../../providers/ror2/system/DataFolderProvider';
import ManagerSettings from '../../../r2mm/manager/ManagerSettings';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import Game from '../../../model/game/Game';
import InteractionProvider from '../../../providers/ror2/system/InteractionProvider';
import R2Error from '../../../model/errors/R2Error';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const dataDirectory = ref<string>(PathResolver.ROOT || 'Not set');
const activeGame = computed<Game>(() => store.state.activeGame);
const settings = ref<ManagerSettings | null>(null);

const profileDirectory = computed<string>(() =>
    store.getters['profile/activeProfile']?.getProfilePath() || 'Not set'
);

const { isVisible } = useSettingSearch(() => props.searchTerm, () => [
    'Data and profile directories',
    dataDirectory.value,
    profileDirectory.value,
    'Change',
    'Browse',
    "Folder",
    "Directory"
]);

onMounted(async () => {
    settings.value = await ManagerSettings.getSingleton(activeGame.value);
});

watch(activeGame, async () => {
    settings.value = await ManagerSettings.getSingleton(activeGame.value);
});

async function changeDataFolder() {
    try {
        const folder = await DataFolderProvider.instance.showSelectionDialog();

        if (folder === null) {
            return;
        }

        await DataFolderProvider.instance.throwForInvalidFolder(folder);
        await DataFolderProvider.instance.writeOverrideFile(folder);
        await settings.value!.setDataDirectory(folder);
        InteractionProvider.instance.restartApp();
    } catch(err) {
        store.commit("error/handleError", R2Error.fromThrownValue(err));
        return
    }
}

function browseDataFolder() {
    if (PathResolver.ROOT) {
        LinkProvider.instance.openPath(PathResolver.ROOT);
    }
}

function browseProfileFolder() {
    const profilePath = store.getters['profile/activeProfile']?.getProfilePath();
    if (profilePath) {
        LinkProvider.instance.openPath(profilePath);
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>数据与配置文件夹</template>
        <template #description>
            <p>所有游戏和配置的模组存储文件夹。</p>
            <p>更改数据文件夹不会移动或删除现有配置。它们将保留在旧文件夹中。</p>
        </template>
        <div class="setting-column">
            <div class="setting-row">
                <label class="setting-label">数据文件夹</label>
                <input
                    class="input setting-input"
                    type="text"
                    :value="dataDirectory"
                    readonly
                />
                <button class="button" @click="changeDataFolder">更改</button>
                <button class="button" @click="browseDataFolder">浏览</button>
            </div>
            <div class="setting-row">
                <label class="setting-label">配置文件夹</label>
                <input
                    class="input setting-input"
                    type="text"
                    :value="profileDirectory"
                    readonly
                />
                <button class="button" @click="browseProfileFolder">浏览</button>
            </div>
        </div>
    </SettingsViewWrapper>
</template>
