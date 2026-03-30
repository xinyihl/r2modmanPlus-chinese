<template>
    <ManagerActivityBar />
    <div id="help-view">
        <Hero title="帮助" subtitle="常见问题及其潜在解决方案" hero-type="primary"/>
        <div
            class="tabs sticky-top sticky-top--opaque sticky-top--no-shadow sticky-top--no-padding has-background-">
            <ul>
                <li v-for="(key, index) in tabs" :key="`tab-${key}`"
                    :class="[{'is-active': activeTab === key}]"
                    @click="changeTab(key)">
                    <a>{{tabsI[index]}}</a>
                </li>
            </ul>
        </div>
        <div class="margin-right" id="help-content">
            <br/>
            <div ref="General" v-if="activeTab === 'General'">
                <h2 class="title is-5">开始安装模组</h2>
                <p>
                    转到 “在线” 选项卡，找到一个模组，然后点击下载。
                    它还会自动下载前置模组，节省你的时间。
                </p>
                <p>安装完你想要的模组后，只需点击左上角的<strong>启动模组</strong>。</p>
                <hr/>
                <h2 class='title is-5'>游戏运行缓慢或卡顿？</h2>
                <p>
                    这可能是由于某个模组抛出错误导致的。
                    一个解决方案是尝试禁用一半的模组，然后检查问题是否仍然存在。
                    <br/>
                    如果问题仍然存在，再禁用另一半。继续这样做，直到问题解决。
                    <br/><br/>
                    如果是卡顿问题，可能会有一些优化模组可以帮助解决。
                </p>
                <hr/>
                   <h2 class='title is-5'>专用服务器</h2>
                <p>
                    管理器不直接支持专用服务器，但你可以手动将配置文件的内容复制到专用服务器文件夹中。
                </p>
                <hr/>
                <h2 class='title is-5'>从模组管理器外部启动游戏</h2>
                <p>
                    默认情况下，通过 Steam 启动游戏时，游戏将是原版（未安装模组）。
                    <br/><br/>
                    你需要在平台的相应启动参数区域中放置相应的参数。
                    <br/>
                    对于 Steam 这可以在游戏的属性中找到。
                    <br/><br/>
                    你当前的参数是：
                    <code v-if="launchArgs.length > 0">{{ launchArgs }}</code>
                    <code v-else>这些参数将在安装 BepInEx 后可用。</code>
                    <br/>
                </p>
                <br/>
                <template v-if="doorstopTarget.length > 0">
                    <p>
                        <button class="button" @click="copyLaunchArgsToClipboard" v-if="!copyingDoorstopText">
                            <i class="fas fa-clipboard"></i>
                            <span class="margin-left--half-width smaller-font">复制启动参数</span>
                        </button>
                        <button class="button is-loading" v-else>复制启动参数</button>
                    </p>
                    <br/>
                </template>
            </div>
            <div ref="Game won't start" v-if="activeTab === `Game won't start`">
                <h2 class='title is-5'>当我尝试启动游戏时出现红色框</h2>
                <p>请阅读红色框底部的建议。</p>
                <hr/>
                <h2 class='title is-5'>我被带到了 Steam 商店页面</h2>
                <p>这是因为你没有合法拥有该游戏。管理器仅支持合法副本。</p>
                <hr/>
                <h2 class='title is-5'>出现一个文本窗口并立即关闭</h2>
                <p>尝试在设置屏幕上运行 “重置 {{store.state.activeGame.displayName}} 安装”。</p>
                <p>如果问题仍然存在，强制退出 Steam 并在关闭 Steam 的情况下启动模组。</p>
            </div>
            <div ref="Mods not appearing" v-if="activeTab === 'Mods not appearing'">
                <h2 class='title is-5'>可能的解决方案</h2>
                <p>最常见的问题可以通过严格按照以下说明解决：
                    <ExternalLink url="https://github.com/ebkr/r2modmanPlus/wiki/Why-aren't-my-mods-working%3F">
                        链接
                    </ExternalLink>
                </p>
            </div>
            <div ref="Updating" v-if="activeTab === 'Updating'">
                <h2 class='title is-5'>自动更新</h2>
                <p>如果有更新可用，管理器会在关闭时自动更新。</p>
                <p>更新会在后台下载。</p>
                <p>你可能会收到一个提示，要求以管理员身份运行 <i>old_uninstaller</i> 这是更新程序。</p>
                <p>如果更新出现问题，请下载并运行最新的安装程序。</p>
                <hr/>
                <h2 class='title is-5'>我不想要更新</h2>
                <p>
                    在 GitHub 上有一个便携版本，不会自动更新。但你仍然会收到更新提示。
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {ExternalLink, Hero} from '../components/all';
import ManagerActivityBar from '../components/navigation/ManagerActivityBar.vue';
import GameRunnerProvider from '../providers/generic/game/GameRunnerProvider';
import R2Error from '../model/errors/R2Error';
import InteractionProvider from '../providers/ror2/system/InteractionProvider';
import {onMounted, ref, watchEffect} from 'vue';
import {getStore} from '../providers/generic/store/StoreProvider';
import {State} from '../store';
import {getDeterminedLaunchType} from "../utils/LaunchUtils";
import {ComputedWrapperLaunchArguments} from "../components/computed/WrapperArguments";
import {getLaunchType, LaunchType} from "../model/real_enums/launch/LaunchType";
import appWindow from '../providers/node/app/app_window';

const store = getStore<State>();

const activeTab = ref('General');
const tabs = ref(['General', 'Game won\'t start', 'Mods not appearing', 'Updating']);
const tabsI = ['一般的', '游戏没有启动', '模组未加载', '更新'];
const doorstopTarget = ref("");
const copyingDoorstopText = ref(false);
const launchArgs = ref("");

watchEffect(async () => {
    const loaderArgs = doorstopTarget.value;
    const prerequisiteText = ComputedWrapperLaunchArguments.value;
    if (appWindow.getPlatform() === 'win32') {
        launchArgs.value = loaderArgs;
        return;
    }
    const storedLaunchType = await getLaunchType(store.state.activeGame);
    const launchType = await getDeterminedLaunchType(store.state.activeGame, storedLaunchType);
    if (launchType === LaunchType.NATIVE) {
        launchArgs.value = `${prerequisiteText} ${loaderArgs}`;
    } else {
        launchArgs.value = `%command% ${loaderArgs}`;
    }
});

function changeTab(key: string) {
    activeTab.value = key;
}

function copyLaunchArgsToClipboard() {
    InteractionProvider.instance.copyToClipboard(launchArgs.value);
    copyingDoorstopText.value = true;
    setTimeout(stopShowingCopy, 400);
}

function stopShowingCopy() {
    copyingDoorstopText.value = false;
}

onMounted(() => {
    GameRunnerProvider.instance.getGameArguments(
        store.state.activeGame,
        store.getters['profile/activeProfile']
    ).then(target => {
        if (target instanceof R2Error) {
            doorstopTarget.value = "";
            return;
        } else {
            doorstopTarget.value = target.map(value => `"${value}"`).join(' ');
        }
    });
});
</script>

<style lang="scss" scoped>
#help-view {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: hidden;
}

#help-content {
    overflow-y: auto;
    flex: 1;
}
</style>
