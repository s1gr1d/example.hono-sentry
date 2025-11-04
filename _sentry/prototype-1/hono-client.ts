import {
  addExceptionMechanism,
  Client,
  ClientOptions,
  Event,
  eventFromUnknownInput,
  EventHint,
  ParameterizedString,
  resolvedSyncPromise,
  SeverityLevel,
  createStackParser,
  nodeStackLineParser,
  getIsolationScope,
} from "@sentry/core";

export interface HonoClientOptions extends ClientOptions {
  // Add Hono-specific options here
}

export class HonoClient extends Client {
  public constructor(options: HonoClientOptions) {
    super(options);
  }

  /**
   * Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`.
   */
  public eventFromException(
    exception: unknown,
    hint?: EventHint,
  ): PromiseLike<Event> {
    const syntheticException = hint?.syntheticException || undefined;

    console.log("eventFromException...");

    // Ensure we have a valid stackParser
    const stackParser =
      this._options.stackParser || createStackParser(nodeStackLineParser());

    const event = eventFromUnknownInput(this, stackParser, exception, hint);

    addExceptionMechanism(event);
    event.level = "error";

    if (hint?.event_id) {
      event.event_id = hint.event_id;
    }

    // console.log("top frame", event.exception.values[0].stacktrace);

    return resolvedSyncPromise(event);
  }

  /**
   * Creates an {@link Event} from primitive inputs to `captureMessage`.
   */
  public eventFromMessage(
    message: ParameterizedString,
    level: SeverityLevel = "info",
    hint?: EventHint,
  ): PromiseLike<Event> {
    const event: Event = {
      message: {
        message: String(message),
      },
      level,
    };

    return Promise.resolve(event);
  }
}
