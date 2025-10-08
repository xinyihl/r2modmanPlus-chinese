<script lang="ts" setup>
import SettingsItem from './SettingsItem.vue';
import SettingsRow from '../../model/settings/SettingsRow';
import ManagerSettings from '../../r2mm/manager/ManagerSettings';
import GameDirectoryResolverProvider from '../../providers/ror2/game/GameDirectoryResolverProvider';
import R2Error from '../../model/errors/R2Error';
import PathResolver from '../../r2mm/manager/PathResolver';
import LogOutputProvider from '../../providers/ror2/data/LogOutputProvider';
import VersionNumber from '../../model/VersionNumber';
import ManagerInformation from '../../_managerinf/ManagerInformation';
import { Hero } from '../all';
import ProfileModList from '../../r2mm/mods/ProfileModList';
import { Platform } from '../../model/schema/ThunderstoreSchema';
import moment from 'moment';
import CdnProvider from '../../providers/generic/connection/CdnProvider';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import VueRouter from 'vue-router';
import { getLaunchType, LaunchType } from "../../model/real_enums/launch/LaunchType";
import { LaunchTypeModalOpen } from "../../components/modals/launch-type/LaunchTypeRefs";
import appWindow from '../../providers/node/app/app_window';

const store = getStore<State>();
let router!: VueRouter;

onMounted(() => {
    router = getCurrentInstance()!.proxy.$router;
})

const activeTab = ref<string>('All');
const tabs = ref<string[]>(['All', 'Profile', 'Locations', 'Debugging', 'Modpacks', 'Other']);
const tabsI = ['全部', '播放集', '位置', '调试', '整合包', '其他'];
const logOutput = ref<LogOutputProvider>(LogOutputProvider.instance);
const search = ref<string>('');
const managerVersionNumber = ref<VersionNumber>(ManagerInformation.VERSION);
const searchableSettings = ref<SettingsRow[]>([]);

const activeGame = computed(() => store.state.activeGame);
const settings = computed(() => store.getters['settings']);
const localModList = computed(() => store.state.profile.modList);
const appName = computed(() => ManagerInformation.APP_NAME);

let settingsList = [
    new SettingsRow(
        'Locations',
        '浏览数据文件夹',
        '打开存储所有游戏和配置文件的模组文件夹',
        async () => PathResolver.ROOT,
        'fa-door-open',
        () => {
            emitInvoke('BrowseDataFolder');
        }
    ),
    new SettingsRow(
        'Locations',
        `更改 ${activeGame.value.displayName} 文件夹`,
        `更改 ${appName.value} 使用的 ${activeGame.value.displayName} 文件夹位置`,
        async () => {
            if (settings.value.getContext().gameSpecific.gameDirectory !== null) {
                const directory = await GameDirectoryResolverProvider.instance.getDirectory(activeGame.value);
                if (!(directory instanceof R2Error)) {
                    return directory;
                }
            }
            return '请手动设置';
        },
        'fa-folder-open',
        () => {
            if (Platform.XBOX_GAME_PASS == activeGame.value.activePlatform.storePlatform) {
                emitInvoke('ChangeGameDirectoryGamePass');
            }
            else {
                emitInvoke('ChangeGameDirectory');
            }
        }
    ),
    new SettingsRow(
        'Locations',
        '浏览配置文件文件夹',
        '打开存储当前配置文件的模组文件夹',
        async () => {
            return store.getters['profile/activeProfile'].getProfilePath();
        },
        'fa-door-open',
        () => emitInvoke('BrowseProfileFolder')
    ),
    new SettingsRow(
        'Locations',
        '更改数据文件夹',
        '更改存储所有游戏和配置文件的模组文件夹。原文件夹不会被删除，现有配置文件不会迁移',
        async () => {
            return PathResolver.ROOT;
        },
        'fa-folder-open',
        () => emitInvoke('ChangeDataFolder')
    ),
    new SettingsRow(
        'Debugging',
        '复制日志内容到剪贴板',
        '将 LogOutput.log 文件内容复制到剪贴板（含 Discord 格式）',
        async () => logOutput.value.exists ? '日志文件存在' : '日志文件不存在',
        'fa-clipboard',
        () => {
            if (logOutput.value.exists) {
                emitInvoke('CopyLogToClipboard')
            }
        }
    ),
    new SettingsRow(
        'Debugging',
        '复制故障排除信息',
        '将设置和其他信息复制到剪贴板（含 Discord 格式）',
        async () => '在 Discord 请求支持时共享此信息。',
        'fa-clipboard',
        () => emitInvoke('CopyTroubleshootingInfoToClipboard')
    ),
    new SettingsRow(
        'Debugging',
        '切换下载缓存',
        '下载模组时将忽略缓存中的模组，但仍会将新模组存入缓存',
        async () => {
            return store.state.download.ignoreCache
                ? '当前：缓存已禁用'
                : '当前：缓存已启用（推荐）';
        },
        'fa-exchange-alt',
        () => emitInvoke('ToggleDownloadCache')
    ),
    new SettingsRow(
        'Debugging',
        '设置启动参数',
        '提供用于启动游戏的自定义参数',
        async () => '这些命令用于游戏启动上的 Steam 可执行文件',
        'fa-wrench',
        () => emitInvoke('SetLaunchParameters')
    ),
    new SettingsRow(
        'Debugging',
        '清理模组缓存',
        '清理未在当前配置文件中使用的缓存模组以释放空间',
        async () => '检查所有配置文件中未使用的 mod 并清除缓存',
        'fa-trash',
        () => emitInvoke('CleanCache')
    ),
    new SettingsRow(
        'Debugging',
        '清理在线模组列表',
        '删除本地模组列表副本，强制下次刷新时重新获取',
        async () => store.dispatch('tsMods/getActiveGameCacheStatus'),
        'fa-trash',
        () => store.dispatch('tsMods/resetActiveGameCache')
    ),
    new SettingsRow(
        'Debugging',
        '切换首选 Thunderstore CDN',
        '临时切换 CDN 直到应用重启，可能解决模组下载问题',
        async () => `当前: ${CdnProvider.current.label} (${CdnProvider.current.url})`,
        'fa-exchange-alt',
        CdnProvider.togglePreferredCdn
    ),
    new SettingsRow(
        'Profile',
        '切换播放集',
        '更换模组播放集',
        async () => {
            return `当前播放集: ${store.getters['profile/activeProfile'].getProfileName()}`
        },
        'fa-file-import',
        () => emitInvoke('ChangeProfile')
    ),
    new SettingsRow(
        'Profile',
        '启用全部模组',
        '为当前播放集启用所有模组',
        async () => `${localModList.value.length - ProfileModList.getDisabledModCount(localModList.value)}/${localModList.value.length} 启用`,
        'fa-file-import',
        () => emitInvoke('EnableAll')
    ),
    new SettingsRow(
        'Profile',
        '禁用全部模组',
        '为当前播放集禁用所有模组',
        async () => `${ProfileModList.getDisabledModCount(localModList.value)}/${localModList.value.length} 禁用`,
        'fa-file-import',
        () => emitInvoke('DisableAll')
    ),
    new SettingsRow(
        'Profile',
        '导入本地模组',
        '从本地文件离线安装模组',
        async () => '并非所有 mod 都可以在本地安装',
        'fa-file-import',
        () => store.commit("openLocalFileImportModal")
    ),
    new SettingsRow(
        'Profile',
        '导出播放集为文件',
        '将模组列表和配置导出为可分享文件',
        async () => '可以与朋友共享导出的文件，以快速轻松地获得相同的播放集',
        'fa-file-export',
        () => store.dispatch("profileExport/exportProfileAsFile")
    ),
    new SettingsRow(
        'Profile',
        '导出播放集为分享代码',
        '将模组列表和配置导出为分享代码',
        async () => '可以与朋友共享导出的代码，以快速轻松地获得相同的播放集',
        'fa-file-export',
        () => store.dispatch("profileExport/exportProfileAsCode")
    ),
    new SettingsRow(
        'Profile',
        '更新全部模组',
        '快速将所有已安装模组更新至最新版本',
        async () => {
            const outdatedMods = store.getters['profile/modsWithUpdates'];
            if (outdatedMods.length === 1) {
                return "1 个模组有一个更新";
            }
            return `${outdatedMods.length} 个模组有一个更新`;
        },
        'fa-cloud-upload-alt',
        () => emitInvoke('UpdateAllMods')
    ),
    new SettingsRow(
        'Other',
        '切换趣味模式',
        '启用/禁用趣味模式',
        async () => {
            return settings.value.getContext().global.funkyModeEnabled
                ? '当前: 启用'
                : '当前: 禁用（默认）';
        },
        'fa-exchange-alt',
        () => emitInvoke('ToggleFunkyMode')
    ),
    new SettingsRow(
        'Other',
        '切换主题',
        '在浅色和深色主题之间切换',
        async () => {
            return settings.value.getContext().global.darkTheme
                ? '当前: 深色主题'
                : '当前: 浅色主题（默认）';
        },
        'fa-exchange-alt',
        () => emitInvoke('SwitchTheme')
    ),
    new SettingsRow(
        'Other',
        '切换卡片显示样式',
        '在展开或折叠卡片视图之间切换',
        async () => {
            return settings.value.getContext().global.expandedCards
                ? '当前：已展开'
                : '当前：已折叠（默认）';
        },
        'fa-exchange-alt',
        () => emitInvoke('SwitchCard')
    ),
    new SettingsRow(
        'Other',
        '刷新在线模组列表',
        '检查新的模组更新',
        async () => {
            if (store.state.tsMods.isThunderstoreModListUpdateInProgress) {
                return store.state.tsMods.thunderstoreModListUpdateStatus || "刷新...";
            }
            if (store.state.tsMods.thunderstoreModListUpdateError) {
                return `刷新 mod 列表错误: ${store.state.tsMods.thunderstoreModListUpdateError.message}`;
            }
            if (store.getters['download/activeDownloadCount'] > 0) {
                return "在有活动下载时，刷新 mod 列表将被禁用。";
            }
            if (store.state.tsMods.modsLastUpdated !== undefined) {
                return "检查日期: " + moment(store.state.tsMods.modsLastUpdated).format("MMMM Do YYYY, h:mm:ss a");
            }
            return "没有可用的 API 信息";
        },
        'fa-exchange-alt',
        async () => await store.dispatch("tsMods/syncPackageList")
    ),
    new SettingsRow(
        'Other',
        '切换游戏',
        '更换当前管理的游戏',
        async () => "",
        'fa-gamepad',
        async () => {
            await ManagerSettings.resetDefaults();
            await router.push({ name: 'index' });
        }
    ),
    new SettingsRow(
        'Modpacks',
        '显示依赖字符串',
        '查看已安装模组的版本依赖字符串（用于 manifest.json 文件）',
        async () => `显示 ${localModList.value.length} 个模组的依赖字符串`,
        'fa-file-alt',
        () => emitInvoke('ShowDependencyStrings')
    ),
];

watch(search, () => {
    searchableSettings.value = settingsList
        .filter(value =>
            value.action.toLowerCase().indexOf(search.value.toLowerCase()) >= 0
            || value.description.toLowerCase().indexOf(search.value.toLowerCase()) >= 0);
});

function getFilteredSettings() {
    return searchableSettings.value.filter(value => value.group.toLowerCase() === activeTab.value.toLowerCase())
        .sort((a, b) => a.action.localeCompare(b.action));
}

onMounted(async () => {
    if ([Platform.STEAM, Platform.STEAM_DIRECT].includes(activeGame.value.activePlatform.storePlatform)) {
        settingsList.push(
            new SettingsRow(
                'Locations',
                '更改 Steam 文件夹',
                `更改 ${appName.value} 使用的 Steam 文件夹的位置。`,
                async () => {
                    if (settings.value.getContext().global.steamDirectory !== null) {
                        const directory = await GameDirectoryResolverProvider.instance.getSteamDirectory();
                        if (!(directory instanceof R2Error)) {
                            return directory;
                        }
                    }
                    return '请手动设置';
                },
                'fa-folder-open',
                () => emitInvoke('ChangeSteamDirectory')
            ),
            new SettingsRow(
                'Debugging',
                `重新安装 ${activeGame.value.displayName}`,
                '修复因手动修改尝试损坏的文件或文件而造成的问题。',
                async () => `这将删除 ${activeGame.value.steamFolderName} 文件夹中的所有内容，并通过 Steam 验证文件`,
                'fa-wrench',
                () => emitInvoke('ValidateSteamInstallation')
            )
        )
    }

    if (['linux', 'darwin'].includes(appWindow.getPlatform()) && activeGame.value.activePlatform.storePlatform === Platform.STEAM) {
        settingsList.push(
            new SettingsRow(
                'Debugging',
                '更改启动行为',
                '选择特定的启动行为，例如强制 Steam 使用 Proton 启动',
                async () => {
                    const launchType = await getLaunchType(activeGame.value);
                    return `当前的启动行为设置为：${launchType}`;
                },
                'fa-gamepad',
                () => {
                    LaunchTypeModalOpen.value = true;
                }
            )
        );
    }
    settingsList = settingsList.sort((a, b) => a.action.localeCompare(b.action));
    searchableSettings.value = settingsList;

    const gameDirectory = await GameDirectoryResolverProvider.instance.getDirectory(activeGame.value);
    if (!(gameDirectory instanceof R2Error)) {
        await settings.value.setGameDirectory(gameDirectory);
    }

    const steamDirectory = await GameDirectoryResolverProvider.instance.getSteamDirectory();
    if (!(steamDirectory instanceof R2Error)) {
        await settings.value.setSteamDirectory(steamDirectory);
    }
});

function changeTab(tab: string) {
    activeTab.value = tab;
}

const emits = defineEmits<{
    (e: 'setting-invoked', setting: string): void;
}>();

function emitInvoke(invoked: string) {
    emits('setting-invoked', invoked);
}

</script>

<template>
    <div id="settings-view">
        <Hero title='设置' :subtitle='`高级选项 ${appName}: ` + managerVersionNumber.toString()' heroType='primary' />
        <div class="margin-right">
            <div class="sticky-top sticky-top--opaque sticky-top--no-shadow sticky-top--no-padding">
                <div class='border-at-bottom'>
                    <div class='card is-shadowless is-square'>
                        <div class='card-header-title'>
                            <span class="non-selectable margin-right" style="white-space: nowrap;">查找:</span>
                            <input v-model='search' class="input" type="text" placeholder="设置..." />
                        </div>
                    </div>
                </div>
                <div class="tabs">
                    <ul>
                        <li v-for="(key, index) in tabs" :key="`tab-${key}`"
                            :class="[{ 'is-active': activeTab === key }]" @click="changeTab(key)">
                            <a>{{ tabsI[index] }}</a>
                        </li>
                    </ul>
                </div>
            </div>
            <template v-if="activeTab === 'All'">
                <SettingsItem v-for="(key, _) in searchableSettings" :key="`setting-${key.action}`" :action="key.action"
                    :description="key.description" :value="key.value" :icon="key.icon" @click="key.clickAction()" />
            </template>
            <template v-else>
                <SettingsItem v-for="(key, _) in getFilteredSettings()" :key="`setting-${key.action}`"
                    :action="key.action" :description="key.description" :value="key.value" :icon="key.icon"
                    @click="key.clickAction()" />
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
#settings-view {
    width: 100%;
}
</style>
