## API Report File for "@snowplow/react-native-tracker"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { BrowserPlugin } from '@snowplow/browser-tracker-core';
import { BrowserPluginConfiguration } from '@snowplow/browser-tracker-core';
import { Platform } from '@snowplow/browser-tracker-core';
import { ScreenTrackingConfiguration } from '@snowplow/browser-plugin-screen-tracking';

// @public
export interface AppLifecycleConfiguration {
    appBuild?: string;
    appVersion?: string;
    installAutotracking?: boolean;
    lifecycleAutotracking?: boolean;
}

// @public (undocumented)
export interface AsyncStorage {
    // (undocumented)
    getItem: (key: string) => Promise<string | null>;
    // (undocumented)
    setItem: (key: string, value: string) => Promise<void>;
}

// @public
export type ConditionalContextProvider = FilterProvider | RuleSetProvider;

// Warning: (ae-forgotten-export) The symbol "ContextEvent" needs to be exported by the entry point index.d.ts
//
// @public
export type ContextFilter = (args?: ContextEvent) => boolean;

// Warning: (ae-forgotten-export) The symbol "SelfDescribingJson" needs to be exported by the entry point index.d.ts
//
// @public
export type ContextGenerator = (args?: ContextEvent) => SelfDescribingJson | SelfDescribingJson[] | undefined;

// @public
export type ContextPrimitive = SelfDescribingJson | ContextGenerator;

// @public
export interface CoreConfiguration {
    /* Should payloads be base64 encoded when built */
    // (undocumented)
    base64?: boolean;
    /* A list of all the plugins to include at load */
    // (undocumented)
    callback?: (PayloadData: PayloadBuilder) => void;
    /* A list of all the plugins to include at load */
    // (undocumented)
    corePlugins?: Array<CorePlugin>;
}

// @public
export interface CorePlugin {
    activateCorePlugin?: (core: TrackerCore) => void;
    afterTrack?: (payload: Payload) => void;
    beforeTrack?: (payloadBuilder: PayloadBuilder) => void;
    contexts?: () => SelfDescribingJson[];
    deactivatePlugin?: (core: TrackerCore) => void;
    filter?: (payload: Payload) => boolean;
    logger?: (logger: Logger) => void;
}

// @public
export interface CorePluginConfiguration {
    /* The plugin to add */
    // (undocumented)
    plugin: CorePlugin;
}

// @public
export interface DeepLinkConfiguration {
    deepLinkContext?: boolean;
}

// @public
export type DeepLinkReceivedProps = {
    url: string;
    referrer?: string;
};

// @public
export interface DeviceTimestamp {
    // (undocumented)
    readonly type: "dtm";
    // (undocumented)
    readonly value: number;
}

// @public
export interface Emitter {
    flush: () => Promise<void>;
    input: (payload: Payload) => Promise<void>;
    setAnonymousTracking: (anonymous: boolean) => void;
    setBufferSize: (bufferSize: number) => void;
    setCollectorUrl: (url: string) => void;
}

// @public (undocumented)
export interface EmitterConfiguration extends EmitterConfigurationBase {
    /* The collector URL to which events will be sent */
    // (undocumented)
    endpoint: string;
    /* http or https. Defaults to https */
    // (undocumented)
    port?: number;
    /* http or https. Defaults to https */
    // (undocumented)
    protocol?: "http" | "https";
    /* http or https. Defaults to https */
    // (undocumented)
    serverAnonymization?: boolean;
}

// @public (undocumented)
export interface EmitterConfigurationBase {
    bufferSize?: number;
    connectionTimeout?: number;
    cookieExtensionService?: string;
    credentials?: "omit" | "same-origin" | "include";
    customFetch?: (input: Request, options?: RequestInit) => Promise<Response>;
    customHeaders?: Record<string, string>;
    dontRetryStatusCodes?: number[];
    eventMethod?: EventMethod;
    // Warning: (ae-forgotten-export) The symbol "EventStore" needs to be exported by the entry point index.d.ts
    eventStore?: EventStore;
    // @deprecated (undocumented)
    idService?: string;
    keepalive?: boolean;
    maxGetBytes?: number;
    maxPostBytes?: number;
    onRequestFailure?: (data: RequestFailure, response?: Response) => void;
    onRequestSuccess?: (data: EventBatch, response: Response) => void;
    postPath?: string;
    retryFailedRequests?: boolean;
    retryStatusCodes?: number[];
    useStm?: boolean;
}

// @public
export type EventBatch = Payload[];

// @public
export type EventContext = SelfDescribingJson;

// @public
export type EventJson = Array<EventJsonWithKeys>;

// @public
export type EventJsonWithKeys = {
    keyIfEncoded: string;
    keyIfNotEncoded: string;
    json: Record<string, unknown>;
};

// @public (undocumented)
export type EventMethod = "post" | "get";

// @public
export interface EventPayloadAndContext {
    context: Array<SelfDescribingJson>;
    event: PayloadBuilder;
}

// @public
export interface EventStoreConfiguration {
    asyncStorage?: AsyncStorage;
    maxEventStoreSize?: number;
    useAsyncStorageForEventStore?: boolean;
}

// @public
export interface EventStoreIterator {
    // Warning: (ae-forgotten-export) The symbol "EventStoreIteratorNextResult" needs to be exported by the entry point index.d.ts
    next: () => Promise<EventStoreIteratorNextResult>;
}

// @public (undocumented)
export interface EventStorePayload {
    payload: Payload;
    svrAnon?: boolean;
}

// @public
export type FilterProvider = [
ContextFilter,
Array<ContextPrimitive> | ContextPrimitive
];

// @public
export interface FormFocusOrChangeEvent {
    elementClasses?: Array<string> | null;
    elementId: string;
    formId: string;
    nodeName: string;
    schema: "change_form" | "focus_form";
    type?: string | null;
    value: string | null;
}

// @public
export function getAllTrackers(): ReactNativeTracker[];

// @public
export function getTracker(trackerNamespace: string): ReactNativeTracker | undefined;

// @public
export function getWebViewCallback(): (message: {
    nativeEvent: {
        data: string;
    };
}) => void;

// @public
export type JsonProcessor = (payloadBuilder: PayloadBuilder, jsonForProcessing: EventJson, contextEntitiesForProcessing: SelfDescribingJson[]) => void;

// @public
export type ListItemViewProps = {
    index: number;
    itemsCount?: number;
};

// @public (undocumented)
export enum LOG_LEVEL {
    // (undocumented)
    debug = 3,
    // (undocumented)
    error = 1,
    // (undocumented)
    info = 4,
    // (undocumented)
    none = 0,
    // (undocumented)
    warn = 2
}

// @public (undocumented)
export interface Logger {
    // (undocumented)
    debug: (message: string, ...extraParams: unknown[]) => void;
    // (undocumented)
    error: (message: string, error?: unknown, ...extraParams: unknown[]) => void;
    // (undocumented)
    info: (message: string, ...extraParams: unknown[]) => void;
    // (undocumented)
    setLogLevel: (level: LOG_LEVEL) => void;
    // (undocumented)
    warn: (message: string, error?: unknown, ...extraParams: unknown[]) => void;
}

// @public
export type MessageNotificationAttachmentProps = {
    identifier: string;
    type: string;
    url: string;
};

// @public
export type MessageNotificationProps = {
    action?: string;
    attachments?: MessageNotificationAttachmentProps[];
    body: string;
    bodyLocArgs?: string[];
    bodyLocKey?: string;
    category?: string;
    contentAvailable?: boolean;
    group?: string;
    icon?: string;
    notificationCount?: number;
    notificationTimestamp?: string;
    sound?: string;
    subtitle?: string;
    tag?: string;
    threadIdentifier?: string;
    title: string;
    titleLocArgs?: string[];
    titleLocKey?: string;
    trigger: Trigger;
};

// Warning: (ae-forgotten-export) The symbol "Configuration" needs to be exported by the entry point index.d.ts
//
// @public
export function newTracker(configuration: Configuration): Promise<ReactNativeTracker>;

// @public
export interface PageViewEvent {
    pageTitle?: string | null;
    pageUrl?: string | null;
    referrer?: string | null;
}

// @public
export type Payload = Record<string, unknown>;

// @public
export interface PayloadBuilder {
    add: (key: string, value: unknown) => void;
    addContextEntity: (entity: SelfDescribingJson) => void;
    addDict: (dict: Payload) => void;
    addJson: (keyIfEncoded: string, keyIfNotEncoded: string, json: Record<string, unknown>) => void;
    build: () => Payload;
    getJson: () => EventJson;
    getPayload: () => Payload;
    withJsonProcessor: (jsonProcessor: JsonProcessor) => void;
}

// @public (undocumented)
export interface PlatformContextConfiguration {
    platformContext?: boolean;
    platformContextProperties?: PlatformContextProperty[];
    platformContextRetriever?: PlatformContextRetriever;
}

// @public (undocumented)
export enum PlatformContextProperty {
    AndroidIdfa = "androidIdfa",
    AppAvailableMemory = "appAvailableMemory",
    AppleIdfa = "appleIdfa",
    AppleIdfv = "appleIdfv",
    AppSetId = "appSetId",
    AppSetIdScope = "appSetIdScope",
    AvailableStorage = "availableStorage",
    BatteryLevel = "batteryLevel",
    BatteryState = "batteryState",
    Carrier = "carrier",
    IsPortrait = "isPortrait",
    Language = "language",
    LowPowerMode = "lowPowerMode",
    NetworkTechnology = "networkTechnology",
    NetworkType = "networkType",
    PhysicalMemory = "physicalMemory",
    Resolution = "resolution",
    Scale = "scale",
    SystemAvailableMemory = "systemAvailableMemory",
    TotalStorage = "totalStorage"
}

// @public
export interface PlatformContextRetriever {
    getAndroidIdfa?: () => Promise<string | undefined>;
    getAppAvailableMemory?: () => Promise<number | undefined>;
    getAppleIdfa?: () => Promise<string | undefined>;
    getAppleIdfv?: () => Promise<string | undefined>;
    getAppSetId?: () => Promise<string | undefined>;
    getAppSetIdScope?: () => Promise<string | undefined>;
    getAvailableStorage?: () => Promise<number | undefined>;
    getBatteryLevel?: () => Promise<number | undefined>;
    getBatteryState?: () => Promise<'unplugged' | 'charging' | 'full' | undefined>;
    getCarrier?: () => Promise<string | undefined>;
    getDeviceManufacturer?: () => Promise<string>;
    getDeviceModel?: () => Promise<string>;
    getLanguage?: () => Promise<string | undefined>;
    getLowPowerMode?: () => Promise<boolean | undefined>;
    getNetworkTechnology?: () => Promise<string | undefined>;
    getNetworkType?: () => Promise<'mobile' | 'wifi' | 'offline' | undefined>;
    getOsType?: () => Promise<string>;
    getOsVersion?: () => Promise<string>;
    getPhysicalMemory?: () => Promise<number | undefined>;
    getResolution?: () => Promise<string | undefined>;
    getScale?: () => Promise<number | undefined>;
    getSystemAvailableMemory?: () => Promise<number | undefined>;
    getTotalStorage?: () => Promise<number | undefined>;
    isPortrait?: () => Promise<boolean | undefined>;
}

// @public
export type ReactNativeTracker = {
    namespace: string;
    readonly trackSelfDescribingEvent: <T extends Record<string, unknown> = Record<string, unknown>>(argmap: SelfDescribing<T>, contexts?: EventContext[]) => void;
    readonly trackScreenViewEvent: (argmap: ScreenViewProps, contexts?: EventContext[]) => void;
    readonly trackScrollChangedEvent: (argmap: ScrollChangedProps, contexts?: EventContext[]) => void;
    readonly trackListItemViewEvent: (argmap: ListItemViewProps, contexts?: EventContext[]) => void;
    readonly trackStructuredEvent: (argmap: StructuredProps, contexts?: EventContext[]) => void;
    readonly trackPageViewEvent: (argmap: PageViewEvent, contexts?: EventContext[]) => void;
    readonly trackTimingEvent: (argmap: TimingProps, contexts?: EventContext[]) => void;
    readonly trackDeepLinkReceivedEvent: (argmap: DeepLinkReceivedProps, contexts?: EventContext[]) => void;
    readonly trackMessageNotificationEvent: (argmap: MessageNotificationProps, contexts?: EventContext[]) => void;
    addGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive> | Record<string, ConditionalContextProvider | ContextPrimitive>): void;
    clearGlobalContexts(): void;
    removeGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive | string>): void;
    addPlugin(configuration: BrowserPluginConfiguration): void;
    flush: () => Promise<void>;
    readonly setAppId: (appId: string) => void;
    readonly setPlatform: (value: string) => void;
    readonly setUserId: (newUid: string) => void;
    readonly setNetworkUserId: (newNuid: string | undefined) => void;
    readonly setDomainUserId: (newDuid: string | undefined) => void;
    readonly setIpAddress: (newIp: string) => void;
    readonly setUseragent: (newUagent: string) => void;
    readonly setTimezone: (newTz: string) => void;
    readonly setLanguage: (newLang: string) => void;
    readonly setScreenResolution: (newRes: ScreenSize) => void;
    readonly setScreenViewport: (newView: ScreenSize) => void;
    readonly setColorDepth: (newLang: number) => void;
    readonly setSubjectData: (config: SubjectConfiguration) => void;
    readonly getSessionUserId: () => Promise<string | undefined>;
    readonly getSessionId: () => Promise<string | undefined>;
    readonly getSessionIndex: () => Promise<number | undefined>;
    readonly getSessionState: () => Promise<SessionState | undefined>;
    readonly getIsInBackground: () => boolean | undefined;
    readonly getBackgroundIndex: () => number | undefined;
    readonly getForegroundIndex: () => number | undefined;
    readonly enablePlatformContext: () => Promise<void>;
    readonly disablePlatformContext: () => void;
    readonly refreshPlatformContext: () => Promise<void>;
};

// @public
export function removeAllTrackers(): void;

// @public
export function removeTracker(trackerNamespace: string): void;

// @public
export type RequestFailure = {
    events: EventBatch;
    status?: number;
    message?: string;
    willRetry: boolean;
};

// @public
export interface RuleSet {
    // (undocumented)
    accept?: Array<string> | string;
    // (undocumented)
    reject?: Array<string> | string;
}

// @public
export type RuleSetProvider = [
RuleSet,
Array<ContextPrimitive> | ContextPrimitive
];

// @public
export type ScreenSize = [number, number];

// @public
export type ScreenViewProps = {
    name: string;
    id?: string;
    type?: string;
    previousName?: string;
    previousId?: string;
    previousType?: string;
    transitionType?: string;
};

// @public
export type ScrollChangedProps = {
    yOffset?: number;
    xOffset?: number;
    viewHeight?: number;
    viewWidth?: number;
    contentHeight?: number;
    contentWidth?: number;
};

// @public
export type SelfDescribing<T = Record<string, unknown>> = SelfDescribingJson<T>;

// @public
export interface SessionConfiguration {
    backgroundSessionTimeout?: number;
    foregroundSessionTimeout?: number;
    sessionContext?: boolean;
}

// @public
export interface SessionState {
    eventIndex?: number;
    firstEventId?: string;
    firstEventTimestamp?: string;
    previousSessionId?: string;
    sessionId: string;
    sessionIndex: number;
    storageMechanism: string;
    userId: string;
}

// Warning: (ae-forgotten-export) The symbol "StructuredEvent" needs to be exported by the entry point index.d.ts
//
// @public
export type StructuredProps = StructuredEvent;

// @public
export interface SubjectConfiguration {
    colorDepth?: number;
    domainUserId?: string;
    ipAddress?: string;
    language?: string;
    networkUserId?: string;
    screenResolution?: ScreenSize;
    screenViewport?: ScreenSize;
    timezone?: string;
    useragent?: string;
    userId?: string;
}

// @public
export type Timestamp = TrueTimestamp | DeviceTimestamp | number;

// @public
export type TimingProps = {
    category: string;
    variable: string;
    timing: number;
    label?: string;
};

// @public
export interface TrackerConfiguration {
    appId?: string;
    devicePlatform?: Platform;
    encodeBase64?: boolean;
    namespace: string;
    plugins?: BrowserPlugin[];
}

// @public
export interface TrackerCore {
    addGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive> | Record<string, ConditionalContextProvider | ContextPrimitive>): void;
    addPayloadDict(dict: Payload): void;
    addPayloadPair: (key: string, value: unknown) => void;
    addPlugin(configuration: CorePluginConfiguration): void;
    clearGlobalContexts(): void;
    deactivate(): void;
    getBase64Encoding(): boolean;
    removeGlobalContexts(contexts: Array<ConditionalContextProvider | ContextPrimitive | string>): void;
    resetPayloadPairs(dict: Payload): void;
    setAppId(appId: string): void;
    setBase64Encoding(encode: boolean): void;
    setColorDepth(depth: string): void;
    setIpAddress(ip: string): void;
    setLang(lang: string): void;
    setPlatform(value: string): void;
    setScreenResolution(width: string, height: string): void;
    setTimezone(timezone: string): void;
    setTrackerNamespace(name: string): void;
    setTrackerVersion(version: string): void;
    setUseragent(useragent: string): void;
    setUserId(userId: string): void;
    setViewport(width: string, height: string): void;
    track: (pb: PayloadBuilder, context?: Array<SelfDescribingJson> | null, timestamp?: Timestamp | null) => Payload | undefined;
}

// @public
export type Trigger = 'push' | 'location' | 'calendar' | 'timeInterval' | 'other';

// @public
export interface TrueTimestamp {
    // (undocumented)
    readonly type: "ttm";
    // (undocumented)
    readonly value: number;
}

// @public (undocumented)
export const version: string;

// (No @packageDocumentation comment for this package)

```
