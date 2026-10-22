# franziskalitz.github.io

## 3D-Stadt: basemap.de Gebäudekarte

Die Karte ist als **„3D-Stadt“** in den vorhandenen Reiter **„Karten“**, direkt unter der Reiseroute, integriert. Die vorhandene Portfolio-Seite bleibt bestehen. Die CesiumJS-Oberfläche ist in `style.css` und `app.js` ausgelagert; `index.html` enthält den Kartenbereich und lädt die Dateien.

### Datenquelle und Format

Die offizielle basemap.de-Seite für 3D-Dienste verlinkt ein CesiumJS-Beispiel mit diesem Gebäudedienst:

```text
https://sgx.geodatenzentrum.de/gdz_basemapde_3d_gebaeude/lod2_4326_null.json
```

Der Endpunkt liefert ein **3D-Tiles-Tileset** (JSON-Tileset-Manifest mit gekachelten 3D-Gebäudegeometrien). Es handelt sich damit um echte LoD2-3D-Gebäude und nicht um eine WMS-/WMTS-Bildebene. Das Tileset wird mit der dokumentierten CesiumJS-Schnittstelle `Cesium.Cesium3DTileset.fromUrl()` geladen. Cesium fordert nur die Kacheln an, die für den aktuellen Blickausschnitt und Detailgrad benötigt werden.

Die Karte verwendet außerdem OpenStreetMap als 2D-Basiskarte auf dem Cesium-Globus. Die OSM-Kacheln sind **nicht** die Gebäude; die Gebäude kommen separat aus dem basemap.de-3D-Tiles-Dienst.

### Voraussetzungen und Zugang

- Für das in der offiziellen basemap.de-Dokumentation gezeigte Beispiel ist kein API-Schlüssel konfiguriert. Cesium Ion wird für diese Anwendung nicht benötigt.
- Es sind keine Umgebungsvariablen oder Zugangsdaten erforderlich.
- Der Zugriff auf basemap.de und OpenStreetMap erfolgt über deren öffentliche HTTPS-Dienste. Verfügbarkeit und Nutzungsbedingungen richten sich nach den jeweiligen Anbietern.
- Die Seite lädt CesiumJS und Leaflet über CDNs. Zum Anzeigen der Karten ist daher eine Internetverbindung erforderlich.
- Der Browser muss WebGL unterstützen. Aktuelle Versionen von Firefox, Chrome, Edge und Safari werden empfohlen.

### Lokal starten

1. Repository und Internetverbindung bereitstellen.
2. Im Projektverzeichnis einen lokalen HTTP-Server starten:

   ```powershell
   python -m http.server 8000
   ```

3. Im Browser `http://localhost:8000/` öffnen und oben **Karten** auswählen.
4. Die Karte **3D-Stadt** befindet sich unter der **Reiseroute (Polyline)**.

Alternativ lässt sich ein beliebiger lokaler statischer Webserver verwenden, zum Beispiel die VS-Code-Erweiterung **Live Server**.

Nicht direkt `index.html` mit `file://` öffnen: Browser beschränken dabei oft Netzwerkzugriffe und können Tileset- oder Kachel-Anfragen blockieren.

### Bedienung

- Mausrad oder Zoom-Steuerung: zoomen.
- Linke Maustaste ziehen: Globus verschieben; rechte Maustaste oder Mausrad-Taste ziehen: Ansicht neigen/rotieren.
- Beim Öffnen startet die 3D-Karte über Berlin, damit die Gebäudedetails direkt geladen werden.
- **Deutschland anzeigen** richtet die Kamera wieder auf Deutschland aus.
- Die Suche springt zu einer der in der Vorschlagsliste enthaltenen deutschen Städte. Sie verwendet lokale Koordinaten und benötigt keinen zusätzlichen Geocoder-Dienst.
- **3D-Gebäudelayer anzeigen** blendet die basemap.de-Gebäude ein oder aus.

### Fehlerbehebung

- **Leere Karte oder Ladefehler:** Internetverbindung und Browser-Konsole prüfen. `app.js` zeigt Dienstfehler in der Oberfläche an und protokolliert die technische Ursache in der Konsole.
- **CORS:** Die Seite wird von einem lokalen HTTP-Server ausgeliefert. Falls ein Proxy, eine Firewall oder Browser-Erweiterung Cross-Origin-Anfragen an `sgx.geodatenzentrum.de`, `tile.openstreetmap.org` oder das CDN blockiert, müssen diese Ziele freigegeben werden. Ein eigener Reverse-Proxy ist nur erforderlich, wenn die Hosting-Umgebung die nötigen CORS-Antwortheader des Anbieters nicht erhält.
- **Authentifizierung:** In der offiziellen Beispielintegration ist kein Schlüssel angegeben. Falls der Dienstanbieter künftig Zugangsdaten verlangt, müssen diese nach dessen Vorgaben ergänzt werden; keine geheimen Schlüssel in öffentliches JavaScript committen.
- **Langsames Rendering:** Das Tileset wird gestreamt und Cesium begrenzt den Detailgrad über `maximumScreenSpaceError` und den Kachel-Cache. Auf der Deutschlandübersicht sind daher weniger Gebäudedetails sichtbar; beim Heranzoomen auf eine Stadt werden die verfügbaren LoD2-Geometrien nachgeladen. Es wird nicht die vollständige Gebäudedarstellung des Landes gleichzeitig in den Browser geladen.
- **Nicht geladene Kartenkacheln:** Die Gebäude können unabhängig von der Hintergrundkarte geladen werden. Bei temporären Fehlern kann die Karte über **Erneut versuchen** erneut geladen werden.

### Offizielle Dokumentation

- [basemap.de – 3D](https://basemap.de/produkte-und-dienste/3d/)
- [basemap.de LoD2-Tileset](https://sgx.geodatenzentrum.de/gdz_basemapde_3d_gebaeude/lod2_4326_null.json)
- [CesiumJS `Cesium3DTileset.fromUrl`](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html)
- [CesiumJS Viewer](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html)
- [OpenStreetMap Copyright und Attribution](https://www.openstreetmap.org/copyright)