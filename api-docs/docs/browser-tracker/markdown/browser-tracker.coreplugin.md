<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@snowplow/browser-tracker](./browser-tracker.md) &gt; [CorePlugin](./browser-tracker.coreplugin.md)

## CorePlugin interface

Interface which defines Core Plugins

<b>Signature:</b>

```typescript
interface CorePlugin 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [activateCorePlugin?](./browser-tracker.coreplugin.activatecoreplugin.md) | (core: TrackerCore) =&gt; void | <i>(Optional)</i> Called when the plugin is initialised during the trackerCore construction |
|  [afterTrack?](./browser-tracker.coreplugin.aftertrack.md) | (payload: Payload) =&gt; void | <i>(Optional)</i> Called just after the trackerCore callback fires |
|  [beforeTrack?](./browser-tracker.coreplugin.beforetrack.md) | (payloadBuilder: PayloadBuilder) =&gt; void | <i>(Optional)</i> Called before the <code>filter</code> method is called and before the trackerCore callback fires (if the filter passes) |
|  [contexts?](./browser-tracker.coreplugin.contexts.md) | () =&gt; SelfDescribingJson\[\] | <i>(Optional)</i> Called when constructing the context for each event Useful for adding additional context to events |
|  [deactivatePlugin?](./browser-tracker.coreplugin.deactivateplugin.md) | (core: TrackerCore) =&gt; void | <i>(Optional)</i> Called when the tracker is being destroyed. Should be used to clean up any resources or listeners that the plugin has created. |
|  [filter?](./browser-tracker.coreplugin.filter.md) | (payload: Payload) =&gt; boolean | <i>(Optional)</i> Called before the payload is sent to the callback to decide whether to send the payload or skip it |
|  [logger?](./browser-tracker.coreplugin.logger.md) | (logger: Logger) =&gt; void | <i>(Optional)</i> Passed a logger instance which can be used to send log information to the active logger |

