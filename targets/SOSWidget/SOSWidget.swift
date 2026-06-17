import WidgetKit
import SwiftUI

// One-tap SOS widget. Tapping it opens Signal straight to the SOS screen via the
// app's URL scheme ("signal:///sos"), which Expo Router already routes. The
// widget shows static content, so the timeline has a single entry and never
// needs to reload on a schedule.

struct SOSEntry: TimelineEntry {
  let date: Date
}

struct SOSProvider: TimelineProvider {
  func placeholder(in context: Context) -> SOSEntry {
    SOSEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (SOSEntry) -> Void) {
    completion(SOSEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SOSEntry>) -> Void) {
    completion(Timeline(entries: [SOSEntry(date: Date())], policy: .never))
  }
}

// Signal's palette, hardcoded so the widget doesn't depend on a generated asset
// catalog: background #08090D, SOS red #F43F4B.
private let signalBackground = Color(red: 0.031, green: 0.035, blue: 0.051)
private let signalRed = Color(red: 0.957, green: 0.247, blue: 0.294)

struct SOSWidgetView: View {
  var body: some View {
    VStack(spacing: 6) {
      Text("SIGNAL")
        .font(.caption2)
        .fontWeight(.bold)
        .foregroundStyle(.white.opacity(0.6))
      Text("SOS")
        .font(.system(size: 34, weight: .heavy))
        .foregroundStyle(signalRed)
      Text("Tap to interrupt the urge")
        .font(.caption2)
        .foregroundStyle(.white.opacity(0.6))
        .multilineTextAlignment(.center)
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct SOSWidget: Widget {
  let kind = "SOSWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SOSProvider()) { _ in
      SOSWidgetView()
        .widgetURL(URL(string: "signal:///sos"))
        .containerBackground(for: .widget) { signalBackground }
    }
    .configurationDisplayName("Signal SOS")
    .description("One tap to open the 10-minute interruption.")
    .supportedFamilies([.systemSmall])
  }
}

@main
struct SignalWidgets: WidgetBundle {
  var body: some Widget {
    SOSWidget()
  }
}
