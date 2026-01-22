<template>
    <div>
        <hero :title=heroTitle :subtitle='splashText' :heroType=heroType />
        <div class='notification is-warning'>
            <p>游戏更新可能会破坏模组。如果发布了新的更新，请耐心等待。</p>
        </div>
        <Progress
            :max='store.state.splash.requests.length * 100'
            :value='reduceRequests().getProgress() > 0 ? reduceRequests().getProgress() : undefined'
            :className='[reduceRequests().getProgress() > 0 ? "is-info" : ""]' />
        <div class='columns'>
            <div class='column is-one-quarter'>
                <aside class='menu'>
                    <p class='menu-label'>帮助</p>
                    <ul class='menu-list'>
                        <li><a @click="view = 'about'" :class="[view === 'about' ? 'is-active' : '']">关于</a></li>
                        <li><a @click="view = 'faq'" :class="[view === 'faq' ? 'is-active' : '']">问答</a></li>
                        <li>
                            <ExternalLink url="https://github.com/ebkr/r2modmanPlus">
                                <i class='fab fa-github fa-lg' aria-hidden='true' />
                            </ExternalLink>
                        </li>
                    </ul>
                </aside>
            </div>
            <div class='column is-three-quarters'>
                <div>
                    <article class='media'>
                        <div class='media-content'>
                            <div class='content'>
                                <div class='container' v-if="view !== 'main'">
                                    <i class='fas fa-long-arrow-alt-left margin-right' />
                                    <strong><a @click="view = 'main'">返回</a></strong>
                                    <br /><br />
                                </div>
                                <div class='container' v-if="view === 'main'">
                                    <p>
                                        <span class='icon margin-right margin-right--half-width'>
                                          <i class='fas fa-info-circle' />
                                        </span>
                                        <strong>你知道吗?</strong>
                                    </p>
                                    <ul class='margin-right'>
                                        <li>
                                            <p>
                                                你可以使用
                                                <link-component
                                                    :url="'https://thunderstore.io'" :target="'external'">Thunderstore
                                                </link-component>
                                                上的 "Install with Mod Manager" 按钮转到 r2modman.
                                            </p>
                                        </li>
                                        <li>
                                            <p>
                                                你可以从设置屏幕中导出所选配置文件作为文件或代码。 这使与朋友分享你的模组列表变得容易！
                                            </p>
                                        </li>
                                    </ul>
                                    <p>
                                        <span class='icon margin-right margin-right--half-width'>
                                          <i class='fas fa-question-circle' />
                                        </span>
                                        <strong>遇到麻烦？</strong>
                                    </p>
                                    <p>
                                        将错误截图发送到 Thunderstore Modding Discord 服务器。如果没有解决，请随时 ping 我。
                                    </p>
                                </div>
                                <div class='container' v-else-if="view === 'about'">
                                    <p>
                                        <span class='icon margin-right margin-right--half-width'>
                                          <i class='fas fa-address-card' />
                                        </span>
                                        <strong>关于 r2modman</strong>
                                    </p>
                                    <p>它由 Ebkr 使用 Quasar 创建。</p>
                                    <p>Quasar 提供以下开发工具，r2modman 正是基于这些工具开发的：</p>
                                    <ul>
                                        <li>Electron</li>
                                        <li>Node</li>
                                        <li>Vue</li>
                                        <li>TypeScript</li>
                                    </ul>
                                </div>
                                <div class='container' v-else-if="view === 'faq'">
                                    <p>
                                        <span class='icon margin-right margin-right--half-width'>
                                          <i class='fas fa-question-circle' />
                                        </span>
                                        <strong>问答</strong>
                                    </p>
                                    <ul>
                                        <li>
                                            <p><strong>我如何开始？</strong></p>
                                            <p>
                                                前往“在线”选项卡，然后下载 Bepinex 和 R2API。
                                            </p>
                                        </li>
                                        <li>
                                            <p><strong>携带模组开始游戏</strong></p>
                                            <p>
                                                你必须从管理器中启动游戏。如果不进行手动操作，通过 Steam 启动是行不通的。
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang='ts' setup>
import { ExternalLink, Hero, Progress } from '../components/all';
import Game from '../model/game/Game';
import FsProvider from '../providers/generic/file/FsProvider';
import PathResolver from '../r2mm/manager/PathResolver';
import { computed, onMounted, ref } from 'vue';
import { State } from '../store';
import { getStore } from '../providers/generic/store/StoreProvider';
import { useRouter } from 'vue-router';
import { useSplashComposable } from '../components/composables/SplashComposable';
import path from '../providers/node/path/path';
import FileUtils from '../utils/FileUtils';
import { areWrapperArgumentsProvided, getDeterminedLaunchType, isManagerRunningOnFlatpak } from '../utils/LaunchUtils';
import appWindow from '../providers/node/app/app_window';
import Buffer from '../providers/node/buffer/buffer';
import ProtocolProvider from '../providers/generic/protocol/ProtocolProvider';
import ManagerSettings from '../r2mm/manager/ManagerSettings';
import { LaunchType } from '../model/real_enums/launch/LaunchType';

const store = getStore<State>();
const router = useRouter();

const {
    reduceRequests
} = useSplashComposable();

const heroTitle = ref<string>('Starting r2modman');
const heroType = ref<string>('primary');
const view = ref<string>('main');
const splashText = computed(() => store.state.splash.splashText);

store.commit('splash/initialiseRequests');

async function moveToNextScreen() {
    if (appWindow.getPlatform() === 'linux') {
        const activeGame: Game = store.state.activeGame;
        const settings = await ManagerSettings.getSingleton(activeGame);
        await ensureWrapperInGameFolder('linux_wrapper.sh');
        await ensureWrapperInGameFolder('steam_executable_launch.sh');
        await ensureWrapperInGameFolder('web_start_wrapper.sh');
        const gameIsProton = await getDeterminedLaunchType(activeGame, settings.getLaunchType() || LaunchType.AUTO) === LaunchType.PROTON;
        if (!gameIsProton || await isManagerRunningOnFlatpak()) {
            if (!(await areWrapperArgumentsProvided(activeGame))) {
                return router.push({name: 'linux'});
            }
        }
    } else if (appWindow.getPlatform() === 'darwin') {
        await ensureWrapperInGameFolder('linux_wrapper.sh');
        return router.push({name: 'linux'});
    }
    return router.push({name: 'profiles'});
}

type WrapperScript = 'linux_wrapper.sh' | 'steam_executable_launch.sh' | 'web_start_wrapper.sh';

async function ensureWrapperInGameFolder(wrapperName: WrapperScript) {
    const staticsDirectory = window.app.getStaticsDirectory();
    const activeGame: Game = store.state.activeGame;
    console.log(`Ensuring wrapper for current game ${activeGame.displayName} in ${path.join(PathResolver.MOD_ROOT, wrapperName)}`);
    try {
        await FsProvider.instance.stat(path.join(PathResolver.MOD_ROOT, wrapperName));
        const oldBuf = (await FsProvider.instance.readFile(path.join(PathResolver.MOD_ROOT, wrapperName)));
        const newBuf = (await FsProvider.instance.readFile(path.join(staticsDirectory, wrapperName)));
        if (!oldBuf.equals(newBuf)) {
            throw new Error('Outdated buffer');
        }
    } catch (_) {
        await FileUtils.ensureDirectory(PathResolver.MOD_ROOT);
        if (await FsProvider.instance.exists(path.join(PathResolver.MOD_ROOT, wrapperName))) {
            await FsProvider.instance.unlink(path.join(PathResolver.MOD_ROOT, wrapperName));
        }
        const wrapperFileResult = await fetch(ProtocolProvider.getPublicAssetUrl(`/${wrapperName}`)).then(res => res.arrayBuffer());
        const wrapperFileContent = Buffer.from(wrapperFileResult);
        await FsProvider.instance.writeFile(path.join(PathResolver.MOD_ROOT, wrapperName), wrapperFileContent);
        await FsProvider.instance.writeFile(path.join(PathResolver.MOD_ROOT, wrapperName), wrapperFileContent);
    }
    await FsProvider.instance.chmod(path.join(PathResolver.MOD_ROOT, wrapperName), 0o755);
}

onMounted(async () => {
    store.commit('splash/updateRequestItem', {
        requestName: 'UpdateCheck',
        value: 100
    } as UpdateRequestItemBody);
    await store.dispatch('splash/getThunderstoreMods');
    moveToNextScreen();
})
</script>
