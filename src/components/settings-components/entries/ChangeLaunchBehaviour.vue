<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import Game from '../../../model/game/Game';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import { getLaunchType, LaunchType } from '../../../model/real_enums/launch/LaunchType';
import { LaunchTypeModalOpen } from '../../modals/launch-type/LaunchTypeRefs';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const activeGame = computed<Game>(() => store.state.activeGame);
const launchType = ref<LaunchType>(LaunchType.AUTO);

const { isVisible } = useSettingSearch(() => props.searchTerm, () => [
    'Change launch behaviour',
    'Set launch mode',
    'Proton',
    'Native',
    'Auto',
    launchType.value,
]);

async function refreshLaunchType() {
    launchType.value = await getLaunchType(activeGame.value);
}

onMounted(refreshLaunchType);
watch(activeGame, refreshLaunchType);

watch(LaunchTypeModalOpen, (open) => {
    if (!open) {
        refreshLaunchType();
    }
});

function openLaunchTypeModal() {
    LaunchTypeModalOpen.value = true;
}
</script>

<template>
    <SettingsViewWrapper >
        <template #title>更改启动行为</template>
        <template #description>
            <p>选择特定的启动行为。你可以告诉管理器某款游戏明确使用 Native 或 Proton。</p>
            <p>当前启动行为设置为：<strong>{{ launchType }}</strong>。</p>
        </template>
        <button class="button" @click="openLaunchTypeModal">更改启动行为</button>
    </SettingsViewWrapper>
</template>
