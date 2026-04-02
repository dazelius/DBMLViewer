using UnityEngine;
using UnityEditor;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Linq;

/// <summary>
/// 현재 씬의 모든 Mesh 데이터와 NavMesh 데이터를 추출하여
/// HTML 3D 뷰어로 시각화하고, 협업을 위한 HTTP 서버를 제공하는 에디터 도구
/// </summary>
public class SceneMeshExporter : EditorWindow
{
    // 서버 설정
    private static HttpListener httpListener;
    private static Thread serverThread;
    private static bool isServerRunning = false;
    private static int serverPort = 9090;
    private static string lastExportedData = "";
    private static string cachedViewerHtmlPath = "";
    private static string cachedViewerHtml = "";
    
    // 협업 데이터
    private static List<FeedbackMarker> feedbackMarkers = new List<FeedbackMarker>();
    private static Dictionary<string, PlayerData> connectedPlayers = new Dictionary<string, PlayerData>();
    private static object markerLock = new object();
    private static object playerLock = new object();
    
    // 내보내기 옵션
    private bool exportMeshes = true;
    private bool exportNavMesh = true;
    private bool exportColliders = false;
    private bool exportTextures = true;
    private bool exportLightmaps = false;  // 기본 OFF (용량 큼)
    private bool simplifyMesh = true;      // 기본 ON - 용량 절감
    private float simplifyThreshold = 0.1f;
    private int maxVerticesPerMesh = 3000; // 더 낮게 - 용량 절감
    private int textureMaxSize = 256;
    private bool exportUVs = true;         // UV 내보내기 옵션
    private int minVerticesPerMesh = 0;    // 작은 메시도 포함 (미니 슬라임 등)
    
    // 텍스처 캐시 (중복 방지) - 파일명만 저장
    private HashSet<string> textureCache = new HashSet<string>();
    
    // UI 상태
    private Vector2 scrollPosition;
    private string exportStatus = "";
    private int totalMeshCount = 0;
    private int totalVertexCount = 0;
    
    [Serializable]
    private class FeedbackMarker
    {
        public string id;
        public string author;
        public string message;
        public string content;  // HTML 뷰어 호환
        public Vector3 position;
        public string color;
        public long timestamp;
        public string type; // "comment", "issue", "suggestion"
    }
    
    [Serializable]
    private class PlayerData
    {
        public string name;
        public float[] position;
        public long lastUpdate;
    }
    
    [Serializable]
    private class PlayerAction
    {
        public string action;  // "join", "leave", "move"
        public string name;
        public float[] position;
    }
    
    [Serializable]
    private class PlayerList
    {
        public List<PlayerData> players;
    }
    
    [Serializable]
    private class ExportData
    {
        public string sceneName;
        public string exportTime;
        public NavMeshData navMesh;
        public List<MeshObjectData> meshObjects;
        public SceneBounds bounds;
        public List<FeedbackMarker> markers;
        // 텍스처/라이트맵은 별도 파일로 분리 (용량 절감)
        public List<string> textureFiles;  // 텍스처 파일명 목록
        public List<SpawnPointData> spawnPoints;  // 스폰 포인트 목록
        public List<NeutralPointCaptureData> neutralPointCaptures;  // 거점 점령 정보
        public List<SafetyZoneData> safetyZones;  // 안전 구역 정보
    }
    
    [Serializable]
    private class SpawnPointData
    {
        public string name;
        public Vector3Data position;
        public Vector3Data rotation;
    }
    
    [Serializable]
    private class NeutralPointCaptureData
    {
        public string name;
        public int uniqueID;
        public int networkObjectID;
        public Vector3Data position;
        public Vector3Data rotation;
        public float radius;
        public int areaShape;  // 0: Circle, 1: Square 등
        public float activeDelayTime;
        public float baseTime;
        public float k;
        public float decay;
        public float tickInterval;
        public int pointCaptureIndex;
        public int[] nextPointCaptureIndex;
    }
    
    [Serializable]
    private class SafetyZoneData
    {
        public string name;
        public Vector3Data position;      // 월드 좌표 위치
        public Vector3Data rotation;      // 회전
        public Vector3Data center;        // BoxCollider 중심 (로컬)
        public Vector3Data size;          // BoxCollider 크기
        public Vector3Data worldCenter;   // BoxCollider 중심 (월드)
        public Vector3Data worldMin;      // 바운드 최소점
        public Vector3Data worldMax;      // 바운드 최대점
    }
    
    [Serializable]
    private class NavMeshData
    {
        public List<Vector3Data> vertices;
        public List<int> indices;
    }
    
    [Serializable]
    private class MeshObjectData
    {
        public string name;
        public string path;
        public string layer;
        public string tag;
        public TransformData transform;
        public MeshGeometry geometry;
        public MaterialInfo material;
        public bool isStatic;
    }
    
    [Serializable]
    private class TransformData
    {
        public Vector3Data position;
        public Vector3Data rotation;
        public Vector3Data scale;
    }
    
    [Serializable]
    private class MeshGeometry
    {
        public List<Vector3Data> vertices;
        public List<int> triangles;
        // normals 제거 - Three.js에서 computeVertexNormals()로 자동 계산
        public List<Vector2Data> uvs;        // 메인 UV만 유지
        // uv2s 제거 - 라이트맵 미사용으로 용량 절감
        public BoundsData bounds;
    }
    
    [Serializable]
    private class Vector2Data
    {
        public float x, y;
        
        public Vector2Data() { }
        
        public Vector2Data(Vector2 v)
        {
            // 소수점 2자리로 반올림
            x = (float)System.Math.Round(v.x, 2);
            y = (float)System.Math.Round(v.y, 2);
        }
        
        public Vector2Data(float x, float y)
        {
            this.x = x;
            this.y = y;
        }
    }
    
    [Serializable]
    private class BoundsData
    {
        public Vector3Data center;
        public Vector3Data size;
    }
    
    [Serializable]
    private class MaterialInfo
    {
        public string name;
        public ColorData color;
        public string shaderName;
        public string mainTextureId;      // 메인 텍스처 ID
        public string normalTextureId;    // 노멀맵 ID
        public Vector2Data mainTextureTiling;   // 텍스처 타일링 (Scale)
        public Vector2Data mainTextureOffset;   // 텍스처 오프셋
        public int lightmapIndex;         // 라이트맵 인덱스 (-1이면 없음)
        public Vector4Data lightmapScaleOffset; // 라이트맵 UV 스케일/오프셋
    }
    
    [Serializable]
    private class Vector4Data
    {
        public float x, y, z, w;
        
        public Vector4Data(Vector4 v)
        {
            x = v.x; y = v.y; z = v.z; w = v.w;
        }
    }
    
    [Serializable]
    private class ColorData
    {
        public float r, g, b, a;
        
        public ColorData(Color c)
        {
            r = c.r; g = c.g; b = c.b; a = c.a;
        }
    }
    
    [Serializable]
    private class Vector3Data
    {
        public float x, y, z;
        
        public Vector3Data(Vector3 v)
        {
            // 소수점 1자리로 반올림 (더 공격적인 용량 절감)
            x = (float)System.Math.Round(v.x, 1);
            y = (float)System.Math.Round(v.y, 1);
            z = (float)System.Math.Round(v.z, 1);
        }
    }
    
    [Serializable]
    private class SceneBounds
    {
        public Vector3Data min;
        public Vector3Data max;
        public Vector3Data center;
        public Vector3Data size;
    }
    
    [MenuItem("Tools/Map/Scene Mesh Exporter (협업 3D 뷰어) %#e")]
    public static void ShowWindow()
    {
        var window = GetWindow<SceneMeshExporter>("Scene Mesh Exporter");
        window.minSize = new Vector2(400, 600);
    }
    
    private void OnEnable()
    {
        UpdateSceneStats();
    }
    
    private void OnDisable()
    {
        StopServer();
    }
    
    private void OnGUI()
    {
        scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);
        
        DrawHeader();
        EditorGUILayout.Space(10);
        DrawExportOptions();
        EditorGUILayout.Space(10);
        DrawSceneStats();
        EditorGUILayout.Space(10);
        DrawServerControls();
        EditorGUILayout.Space(10);
        DrawExportButtons();
        EditorGUILayout.Space(10);
        DrawFeedbackPanel();
        EditorGUILayout.Space(10);
        DrawHelpSection();
        
        EditorGUILayout.EndScrollView();
    }
    
    private void DrawHeader()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("🗺️ Scene Mesh Exporter", EditorStyles.boldLabel);
        GUILayout.Label("씬의 Mesh와 NavMesh 데이터를 추출하여 3D 협업 뷰어로 시각화", EditorStyles.miniLabel);
        EditorGUILayout.EndVertical();
    }
    
    private void DrawExportOptions()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("내보내기 옵션", EditorStyles.boldLabel);
        
        exportMeshes = EditorGUILayout.Toggle("Mesh 오브젝트 내보내기", exportMeshes);
        exportNavMesh = EditorGUILayout.Toggle("NavMesh 내보내기", exportNavMesh);
        exportColliders = EditorGUILayout.Toggle("Collider 내보내기", exportColliders);
        
        EditorGUILayout.Space(5);
        EditorGUILayout.LabelField("텍스처 옵션", EditorStyles.boldLabel);
        
        exportTextures = EditorGUILayout.Toggle("텍스처 내보내기", exportTextures);
        if (exportTextures)
        {
            EditorGUI.indentLevel++;
            textureMaxSize = EditorGUILayout.IntPopup("텍스처 최대 크기", textureMaxSize, 
                new string[] { "64 (초소형)", "128 (소형)", "256 (권장)", "512", "1024" }, 
                new int[] { 64, 128, 256, 512, 1024 });
            EditorGUILayout.HelpBox("작을수록 파일 크기 감소. 256 권장.", MessageType.None);
            EditorGUI.indentLevel--;
        }
        
        exportLightmaps = EditorGUILayout.Toggle("라이트맵 내보내기 (용량 큼)", exportLightmaps);
        if (exportLightmaps)
        {
            EditorGUI.indentLevel++;
            EditorGUILayout.HelpBox("⚠️ 라이트맵은 파일 크기를 크게 증가시킵니다!", MessageType.Warning);
            EditorGUI.indentLevel--;
        }
        
        EditorGUILayout.Space(5);
        
        simplifyMesh = EditorGUILayout.Toggle("Mesh 단순화", simplifyMesh);
        if (simplifyMesh)
        {
            EditorGUI.indentLevel++;
            maxVerticesPerMesh = EditorGUILayout.IntSlider("최대 버텍스/메시", maxVerticesPerMesh, 500, 10000);
            EditorGUI.indentLevel--;
        }
        
        EditorGUILayout.Space(5);
        EditorGUILayout.LabelField("용량 최적화", EditorStyles.boldLabel);
        minVerticesPerMesh = EditorGUILayout.IntSlider("최소 버텍스 (이하 제외)", minVerticesPerMesh, 0, 100);
        exportUVs = EditorGUILayout.Toggle("UV 좌표 포함", exportUVs);
        
        EditorGUILayout.EndVertical();
    }
    
    private void DrawSceneStats()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("씬 통계", EditorStyles.boldLabel);
        
        EditorGUILayout.LabelField("씬 이름", SceneManager.GetActiveScene().name);
        EditorGUILayout.LabelField("Mesh 오브젝트 수", totalMeshCount.ToString("N0"));
        EditorGUILayout.LabelField("총 버텍스 수", totalVertexCount.ToString("N0"));
        
        if (GUILayout.Button("통계 새로고침", GUILayout.Height(25)))
        {
            UpdateSceneStats();
        }
        
        EditorGUILayout.EndVertical();
    }
    
    private void DrawServerControls()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("협업 서버", EditorStyles.boldLabel);
        
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.LabelField("포트", GUILayout.Width(40));
        GUI.enabled = !isServerRunning;
        serverPort = EditorGUILayout.IntField(serverPort, GUILayout.Width(80));
        GUI.enabled = true;
        
        GUIStyle statusStyle = new GUIStyle(EditorStyles.label);
        statusStyle.normal.textColor = isServerRunning ? Color.green : Color.gray;
        EditorGUILayout.LabelField(isServerRunning ? "● 실행 중" : "○ 중지됨", statusStyle);
        EditorGUILayout.EndHorizontal();
        
        EditorGUILayout.BeginHorizontal();
        
        if (!isServerRunning)
        {
            if (GUILayout.Button("▶ 서버 시작", GUILayout.Height(30)))
            {
                StartServer();
            }
        }
        else
        {
            if (GUILayout.Button("■ 서버 중지", GUILayout.Height(30)))
            {
                StopServer();
            }
            
            if (GUILayout.Button("🌐 뷰어 열기", GUILayout.Height(30)))
            {
                Application.OpenURL($"http://localhost:{serverPort}");
            }
        }
        
        EditorGUILayout.EndHorizontal();
        
        if (isServerRunning)
        {
            EditorGUILayout.HelpBox($"뷰어 URL: http://localhost:{serverPort}", MessageType.Info);
        }
        
        EditorGUILayout.EndVertical();
    }
    
    private void DrawExportButtons()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("내보내기", EditorStyles.boldLabel);
        
        // 메인 내보내기 버튼 (텍스처 분리)
        if (GUILayout.Button("📁 폴더로 내보내기 (JSON + 텍스처 분리) ⭐", GUILayout.Height(40)))
        {
            ExportToFileWithTextures();
        }
        EditorGUILayout.HelpBox("JSON과 텍스처 파일을 분리하여 용량 최적화", MessageType.None);
        
        EditorGUILayout.Space(5);
        
        EditorGUILayout.BeginHorizontal();
        
        if (GUILayout.Button("단일 JSON (텍스처 포함)", GUILayout.Height(28)))
        {
            ExportToFile();
        }
        
        if (GUILayout.Button("서버 데이터 갱신", GUILayout.Height(28)))
        {
            RefreshServerData();
        }
        
        EditorGUILayout.EndHorizontal();
        
        if (!string.IsNullOrEmpty(exportStatus))
        {
            EditorGUILayout.HelpBox(exportStatus, MessageType.Info);
        }
        
        EditorGUILayout.EndVertical();
    }
    
    private void DrawFeedbackPanel()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label($"피드백 마커 ({feedbackMarkers.Count}개)", EditorStyles.boldLabel);
        
        if (feedbackMarkers.Count > 0)
        {
            lock (markerLock)
            {
                int toRemove = -1;
                for (int i = 0; i < Mathf.Min(feedbackMarkers.Count, 10); i++)
                {
                    var marker = feedbackMarkers[i];
                    EditorGUILayout.BeginHorizontal();
                    
                    string typeIcon = marker.type switch
                    {
                        "issue" => "⚠️",
                        "suggestion" => "💡",
                        _ => "💬"
                    };
                    
                    EditorGUILayout.LabelField($"{typeIcon} [{marker.author}]", GUILayout.Width(120));
                    EditorGUILayout.LabelField(marker.message);
                    
                    if (GUILayout.Button("이동", GUILayout.Width(40)))
                    {
                        // Scene View에서 해당 위치로 이동
                        SceneView.lastActiveSceneView.pivot = marker.position;
                        SceneView.lastActiveSceneView.Repaint();
                    }
                    
                    if (GUILayout.Button("X", GUILayout.Width(25)))
                    {
                        toRemove = i;
                    }
                    
                    EditorGUILayout.EndHorizontal();
                }
                
                if (toRemove >= 0)
                {
                    feedbackMarkers.RemoveAt(toRemove);
                }
            }
            
            if (feedbackMarkers.Count > 10)
            {
                EditorGUILayout.LabelField($"... 외 {feedbackMarkers.Count - 10}개", EditorStyles.miniLabel);
            }
            
            if (GUILayout.Button("모든 마커 제거", GUILayout.Height(25)))
            {
                lock (markerLock)
                {
                    feedbackMarkers.Clear();
                }
            }
        }
        else
        {
            EditorGUILayout.HelpBox("뷰어에서 추가한 피드백 마커가 여기에 표시됩니다.", MessageType.None);
        }
        
        EditorGUILayout.EndVertical();
    }
    
    private void DrawHelpSection()
    {
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        GUILayout.Label("도움말", EditorStyles.boldLabel);
        
        EditorGUILayout.HelpBox(
            "사용법:\n" +
            "1. 내보내기 옵션을 설정합니다.\n" +
            "2. '서버 시작' 버튼을 클릭합니다.\n" +
            "3. '뷰어 열기'로 브라우저에서 3D 맵을 확인합니다.\n" +
            "4. 팀원들과 URL을 공유하여 협업합니다.\n\n" +
            "단축키: Ctrl+Shift+E",
            MessageType.Info
        );
        
        EditorGUILayout.EndVertical();
    }
    
    private void UpdateSceneStats()
    {
        totalMeshCount = 0;
        totalVertexCount = 0;
        
        foreach (var mf in FindObjectsOfType<MeshFilter>())
        {
            // 비활성화된 오브젝트 제외
            if (!mf.gameObject.activeInHierarchy) continue;
            if (mf.sharedMesh != null)
            {
                totalMeshCount++;
                totalVertexCount += mf.sharedMesh.vertexCount;
            }
        }
        
        foreach (var smr in FindObjectsOfType<SkinnedMeshRenderer>())
        {
            // 비활성화된 오브젝트 제외
            if (!smr.gameObject.activeInHierarchy) continue;
            if (smr.sharedMesh != null)
            {
                totalMeshCount++;
                totalVertexCount += smr.sharedMesh.vertexCount;
            }
        }
    }
    
    private void StartServer()
    {
        if (isServerRunning) return;
        
        try
        {
            // 먼저 데이터 내보내기 (메인 스레드에서)
            RefreshServerData();
            
            // HTML 파일 경로와 내용을 미리 캐시 (메인 스레드에서)
            CacheViewerHtml();
            
            httpListener = new HttpListener();
            httpListener.Prefixes.Add($"http://localhost:{serverPort}/");
            httpListener.Prefixes.Add($"http://127.0.0.1:{serverPort}/");
            
            // 외부 접속 허용 (관리자 권한 필요할 수 있음)
            try
            {
                httpListener.Prefixes.Add($"http://*:{serverPort}/");
            }
            catch { }
            
            httpListener.Start();
            isServerRunning = true;
            
            serverThread = new Thread(ServerLoop);
            serverThread.IsBackground = true;
            serverThread.Start();
            
            Debug.Log($"[SceneMeshExporter] 서버가 시작되었습니다. http://localhost:{serverPort}");
            exportStatus = $"서버가 포트 {serverPort}에서 실행 중입니다.";
        }
        catch (Exception e)
        {
            Debug.LogError($"[SceneMeshExporter] 서버 시작 실패: {e.Message}");
            exportStatus = $"서버 시작 실패: {e.Message}";
            isServerRunning = false;
        }
    }
    
    private void StopServer()
    {
        if (!isServerRunning) return;
        
        isServerRunning = false;
        
        try
        {
            httpListener?.Stop();
            httpListener?.Close();
            serverThread?.Join(1000);
        }
        catch { }
        
        httpListener = null;
        serverThread = null;
        
        Debug.Log("[SceneMeshExporter] 서버가 중지되었습니다.");
        exportStatus = "서버가 중지되었습니다.";
    }
    
    private void ServerLoop()
    {
        while (isServerRunning && httpListener != null && httpListener.IsListening)
        {
            try
            {
                var context = httpListener.GetContext();
                ThreadPool.QueueUserWorkItem(o => HandleRequest(context));
            }
            catch (HttpListenerException)
            {
                // 서버 중지 시 발생
                break;
            }
            catch (Exception e)
            {
                Debug.LogError($"[SceneMeshExporter] 요청 처리 오류: {e.Message}");
            }
        }
    }
    
    private void HandleRequest(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;
        
        try
        {
            string path = request.Url.AbsolutePath;
            
            // CORS 헤더 추가
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
            
            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 200;
                response.Close();
                return;
            }
            
            byte[] buffer;
            
            // 요청 로깅
            Debug.Log($"[SceneMeshExporter] 요청: {request.HttpMethod} {path}");
            
            switch (path)
            {
                case "/":
                case "/index.html":
                    // HTML 뷰어 제공 (캐시된 내용 사용)
                    if (string.IsNullOrEmpty(cachedViewerHtml))
                    {
                        cachedViewerHtml = GetEmbeddedViewerHtml();
                    }
                    buffer = Encoding.UTF8.GetBytes(cachedViewerHtml);
                    response.ContentType = "text/html; charset=utf-8";
                    break;
                    
                case "/api/data":
                    // 씬 데이터 제공
                    if (string.IsNullOrEmpty(lastExportedData))
                    {
                        lastExportedData = "{}";
                    }
                    buffer = Encoding.UTF8.GetBytes(lastExportedData);
                    response.ContentType = "application/json; charset=utf-8";
                    break;
                    
                case "/api/markers":
                    if (request.HttpMethod == "GET")
                    {
                        // 마커 목록 반환
                        lock (markerLock)
                        {
                            buffer = Encoding.UTF8.GetBytes(JsonUtility.ToJson(new MarkerList { markers = feedbackMarkers }));
                        }
                        response.ContentType = "application/json; charset=utf-8";
                    }
                    else if (request.HttpMethod == "POST")
                    {
                        // 마커 추가
                        using (var reader = new StreamReader(request.InputStream))
                        {
                            string json = reader.ReadToEnd();
                            var marker = JsonUtility.FromJson<FeedbackMarker>(json);
                            
                            // ID가 없으면 생성
                            if (string.IsNullOrEmpty(marker.id))
                                marker.id = Guid.NewGuid().ToString();
                            
                            // 타임스탬프가 없으면 현재 시간
                            if (marker.timestamp == 0)
                                marker.timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                            
                            // content와 message 동기화
                            if (!string.IsNullOrEmpty(marker.content) && string.IsNullOrEmpty(marker.message))
                                marker.message = marker.content;
                            else if (!string.IsNullOrEmpty(marker.message) && string.IsNullOrEmpty(marker.content))
                                marker.content = marker.message;
                            
                            lock (markerLock)
                            {
                                feedbackMarkers.Add(marker);
                            }
                            
                            Debug.Log($"[SceneMeshExporter] 마커 추가: {marker.author} - {marker.content}");
                            buffer = Encoding.UTF8.GetBytes(JsonUtility.ToJson(marker));
                        }
                        response.ContentType = "application/json; charset=utf-8";
                    }
                    else if (request.HttpMethod == "DELETE")
                    {
                        // 마커 삭제
                        string markerId = request.QueryString["id"];
                        lock (markerLock)
                        {
                            feedbackMarkers.RemoveAll(m => m.id == markerId);
                        }
                        buffer = Encoding.UTF8.GetBytes("{\"success\": true}");
                        response.ContentType = "application/json; charset=utf-8";
                    }
                    else
                    {
                        buffer = Encoding.UTF8.GetBytes("{}");
                        response.ContentType = "application/json";
                    }
                    break;
                    
                case "/api/players":
                    if (request.HttpMethod == "GET")
                    {
                        // 플레이어 목록 반환
                        lock (playerLock)
                        {
                            // 30초 이상 업데이트 없는 플레이어 제거
                            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                            var toRemove = connectedPlayers.Where(kvp => now - kvp.Value.lastUpdate > 30000).Select(kvp => kvp.Key).ToList();
                            foreach (var key in toRemove) connectedPlayers.Remove(key);
                            
                            var playerList = new PlayerList { players = connectedPlayers.Values.ToList() };
                            buffer = Encoding.UTF8.GetBytes(JsonUtility.ToJson(playerList));
                        }
                        response.ContentType = "application/json; charset=utf-8";
                    }
                    else if (request.HttpMethod == "POST")
                    {
                        using (var reader = new StreamReader(request.InputStream))
                        {
                            string json = reader.ReadToEnd();
                            var action = JsonUtility.FromJson<PlayerAction>(json);
                            
                            lock (playerLock)
                            {
                                switch (action.action)
                                {
                                    case "join":
                                        connectedPlayers[action.name] = new PlayerData 
                                        { 
                                            name = action.name, 
                                            position = action.position ?? new float[] { 0, 0, 0 },
                                            lastUpdate = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                                        };
                                        Debug.Log($"[SceneMeshExporter] 플레이어 접속: {action.name}");
                                        break;
                                        
                                    case "leave":
                                        connectedPlayers.Remove(action.name);
                                        Debug.Log($"[SceneMeshExporter] 플레이어 퇴장: {action.name}");
                                        break;
                                        
                                    case "move":
                                        if (connectedPlayers.ContainsKey(action.name))
                                        {
                                            connectedPlayers[action.name].position = action.position;
                                            connectedPlayers[action.name].lastUpdate = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                                        }
                                        break;
                                }
                            }
                            buffer = Encoding.UTF8.GetBytes("{\"success\": true}");
                        }
                        response.ContentType = "application/json; charset=utf-8";
                    }
                    else
                    {
                        buffer = Encoding.UTF8.GetBytes("{}");
                        response.ContentType = "application/json";
                    }
                    break;
                    
                case "/favicon.ico":
                    // favicon 요청 - 빈 응답
                    response.StatusCode = 204;
                    buffer = new byte[0];
                    break;
                    
                default:
                    Debug.LogWarning($"[SceneMeshExporter] 404 Not Found: {path}");
                    response.StatusCode = 404;
                    buffer = Encoding.UTF8.GetBytes($"Not Found: {path}");
                    response.ContentType = "text/plain";
                    break;
            }
            
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
        }
        catch (Exception e)
        {
            Debug.LogError($"[SceneMeshExporter] 요청 처리 오류: {e.Message}");
            response.StatusCode = 500;
        }
        finally
        {
            response.Close();
        }
    }
    
    [Serializable]
    private class MarkerList
    {
        public List<FeedbackMarker> markers;
    }
    
    /// <summary>
    /// 메인 스레드에서 HTML 파일을 미리 캐시합니다
    /// </summary>
    private void CacheViewerHtml()
    {
        // 여러 방법으로 HTML 파일 찾기 시도
        string[] possiblePaths = new string[]
        {
            // 현재 씬 폴더에서 찾기
            Path.Combine(Path.GetDirectoryName(SceneManager.GetActiveScene().path) ?? "", "collaborative_map_viewer.html"),
            // Assets 폴더 내 검색
            FindHtmlViewerPath(),
            // 프로젝트 루트 기준
            Path.Combine(Application.dataPath, "GameContents/Map/OldTown_01/collaborative_map_viewer.html")
        };
        
        cachedViewerHtmlPath = "";
        foreach (var path in possiblePaths)
        {
            if (!string.IsNullOrEmpty(path))
            {
                string fullPath = path.StartsWith("Assets/") 
                    ? Path.Combine(Application.dataPath.Replace("/Assets", ""), path)
                    : path;
                    
                if (File.Exists(fullPath))
                {
                    cachedViewerHtmlPath = fullPath;
                    break;
                }
            }
        }
        
        // HTML 파일 내용 미리 읽기
        if (!string.IsNullOrEmpty(cachedViewerHtmlPath) && File.Exists(cachedViewerHtmlPath))
        {
            cachedViewerHtml = File.ReadAllText(cachedViewerHtmlPath, Encoding.UTF8);
            Debug.Log($"[SceneMeshExporter] HTML 뷰어 캐시됨: {cachedViewerHtmlPath}");
        }
        else
        {
            cachedViewerHtml = GetEmbeddedViewerHtml();
            Debug.LogWarning($"[SceneMeshExporter] HTML 파일을 찾을 수 없어 내장 뷰어 사용");
        }
    }
    
    /// <summary>
    /// AssetDatabase를 사용하여 HTML 뷰어 파일 경로 찾기
    /// </summary>
    private string FindHtmlViewerPath()
    {
        string[] guids = AssetDatabase.FindAssets("collaborative_map_viewer");
        foreach (var guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            if (path.EndsWith(".html"))
            {
                return path;
            }
        }
        return null;
    }
    
    private void RefreshServerData()
    {
        lastExportedData = ExportSceneData();
        exportStatus = $"데이터 갱신 완료 ({DateTime.Now:HH:mm:ss})";
        Debug.Log("[SceneMeshExporter] 서버 데이터가 갱신되었습니다.");
    }
    
    private void ExportToFile()
    {
        string defaultName = $"{SceneManager.GetActiveScene().name}_mesh_data.json";
        string path = EditorUtility.SaveFilePanel("Mesh 데이터 내보내기", "", defaultName, "json");
        
        if (!string.IsNullOrEmpty(path))
        {
            string json = ExportSceneData();
            File.WriteAllText(path, json, Encoding.UTF8);
            
            // 파일 크기 표시
            long fileSize = new FileInfo(path).Length;
            string sizeStr = fileSize > 1024 * 1024 
                ? $"{fileSize / (1024 * 1024f):F1}MB" 
                : $"{fileSize / 1024f:F1}KB";
            
            exportStatus = $"저장 완료: {Path.GetFileName(path)} ({sizeStr})";
            Debug.Log($"[SceneMeshExporter] 파일 저장 완료: {path} ({sizeStr})");
        }
    }
    
    private void ExportToFileWithTextures()
    {
        string defaultName = $"{SceneManager.GetActiveScene().name}_data";
        string folderPath = EditorUtility.SaveFolderPanel("내보내기 폴더 선택", "", defaultName);
        
        if (string.IsNullOrEmpty(folderPath)) return;
        
        // 텍스처 폴더 생성
        string texturesFolder = Path.Combine(folderPath, "textures");
        if (!Directory.Exists(texturesFolder))
            Directory.CreateDirectory(texturesFolder);
        
        // 텍스처를 파일로 내보내기
        textureFileMap.Clear();
        ExportTexturesToFiles(texturesFolder);
        
        // === 분리된 JSON 내보내기 (부분 로딩용) ===
        ExportSplitJsonFiles(folderPath);
        
        EditorUtility.DisplayDialog("내보내기 완료", 
            $"분리 내보내기 완료!\n\n" +
            $"📁 {folderPath}\n" +
            $"  ├─ scene_info.json (기본 정보)\n" +
            $"  ├─ meshes.json (메시 데이터)\n" +
            $"  ├─ navmesh.json (NavMesh)\n" +
            $"  └─ textures/ (텍스처 파일)\n\n" +
            $"HTML 뷰어에서 폴더를 열면 부분 로딩됩니다.", 
            "확인");
    }
    
    // 분리된 JSON 파일 내보내기
    private void ExportSplitJsonFiles(string folderPath)
    {
        textureCache.Clear();
        
        string sceneName = SceneManager.GetActiveScene().name;
        Bounds sceneBounds = new Bounds();
        bool boundsInit = false;
        
        // 1. 메시 데이터 수집
        var meshObjects = new List<MeshObjectData>();
        // Skybox, SkyDome만 제외 (Sky_Default는 포함)
        string[] excludePatterns = { "Skybox", "SkyDome" };
        
        var meshFilters = FindObjectsOfType<MeshFilter>();
        int total = meshFilters.Length;
        int current = 0;
        
        foreach (var mf in meshFilters)
        {
            current++;
            if (current % 20 == 0)
                EditorUtility.DisplayProgressBar("메시 수집", $"{current}/{total}", (float)current / total);
            
            if (!mf.gameObject.activeInHierarchy) continue;
            if (mf.sharedMesh == null) continue;
            if (mf.sharedMesh.vertexCount < minVerticesPerMesh) continue;
            
            bool exclude = false;
            foreach (var p in excludePatterns)
                if (mf.gameObject.name.Contains(p)) { exclude = true; break; }
            if (exclude) continue;
            
            var renderer = mf.GetComponent<Renderer>();
            if (renderer == null || !renderer.enabled) continue;
            
            var meshData = CreateMeshObjectDataWithTextureFile(mf.gameObject, mf.sharedMesh, renderer);
            if (meshData != null)
            {
                meshObjects.Add(meshData);
                if (!boundsInit) { sceneBounds = renderer.bounds; boundsInit = true; }
                else sceneBounds.Encapsulate(renderer.bounds);
            }
        }
        EditorUtility.ClearProgressBar();
        
        // 2. NavMesh 데이터
        var navMeshData = exportNavMesh ? ExportNavMeshData() : null;
        
        // 3. 스폰 포인트 수집
        var spawnPoints = CollectSpawnPoints();
        if (spawnPoints.Count > 0)
            Debug.Log($"[SceneMeshExporter] 스폰 포인트 {spawnPoints.Count}개 발견");
        
        // 3-1. 거점 점령 정보 수집
        var neutralPointCaptures = CollectNeutralPointCaptures();
        if (neutralPointCaptures.Count > 0)
            Debug.Log($"[SceneMeshExporter] 거점 점령 포인트 {neutralPointCaptures.Count}개 발견");
        
        // 3-2. 안전 구역 수집
        var safetyZones = CollectSafetyZones();
        if (safetyZones.Count > 0)
            Debug.Log($"[SceneMeshExporter] 안전 구역 {safetyZones.Count}개 발견");
        
        // 4. scene_info.json 저장 (기본 정보 + 스폰 포인트 + 거점 점령 + 안전 구역)
        var sceneInfo = new SceneInfoData
        {
            sceneName = sceneName,
            exportTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            meshCount = meshObjects.Count,
            hasNavMesh = navMeshData != null,
            textureFiles = textureCache.ToList(),
            bounds = new SceneBounds
            {
                min = new Vector3Data(sceneBounds.min),
                max = new Vector3Data(sceneBounds.max)
            },
            spawnPoints = spawnPoints,
            neutralPointCaptures = neutralPointCaptures,
            safetyZones = safetyZones
        };
        
        string infoPath = Path.Combine(folderPath, "scene_info.json");
        File.WriteAllText(infoPath, JsonUtility.ToJson(sceneInfo, true), Encoding.UTF8);
        long infoSize = new FileInfo(infoPath).Length;
        Debug.Log($"[SceneMeshExporter] scene_info.json: {infoSize / 1024f:F1}KB");
        
        // 4. meshes.json 저장 (메시 데이터) - 청크로 분할 가능
        var meshesData = new MeshesData { meshObjects = meshObjects };
        string meshesPath = Path.Combine(folderPath, "meshes.json");
        File.WriteAllText(meshesPath, JsonUtility.ToJson(meshesData), Encoding.UTF8);
        long meshSize = new FileInfo(meshesPath).Length;
        string meshSizeStr = meshSize > 1024 * 1024 ? $"{meshSize / (1024 * 1024f):F1}MB" : $"{meshSize / 1024f:F1}KB";
        Debug.Log($"[SceneMeshExporter] meshes.json: {meshSizeStr} ({meshObjects.Count}개 메시)");
        
        // 5. navmesh.json 저장
        if (navMeshData != null)
        {
            var navData = new NavMeshExportData { navMesh = navMeshData };
            string navPath = Path.Combine(folderPath, "navmesh.json");
            File.WriteAllText(navPath, JsonUtility.ToJson(navData), Encoding.UTF8);
            long navSize = new FileInfo(navPath).Length;
            Debug.Log($"[SceneMeshExporter] navmesh.json: {navSize / 1024f:F1}KB");
        }
        
        // 용량 분석
        int totalVerts = 0, totalTris = 0;
        foreach (var m in meshObjects)
        {
            if (m.geometry != null)
            {
                totalVerts += m.geometry.vertices?.Count ?? 0;
                totalTris += m.geometry.triangles?.Count ?? 0;
            }
        }
        Debug.Log($"[SceneMeshExporter] === 용량 분석 ===");
        Debug.Log($"[SceneMeshExporter] 메시: {meshObjects.Count}개, 버텍스: {totalVerts:N0}, 삼각형: {totalTris:N0}");
        
        exportStatus = $"분리 저장 완료! 메시: {meshSizeStr}, 텍스처: {textureCache.Count}개";
    }
    
    // 분리 저장용 데이터 클래스
    [Serializable]
    private class SceneInfoData
    {
        public string sceneName;
        public string exportTime;
        public int meshCount;
        public bool hasNavMesh;
        public List<string> textureFiles;
        public SceneBounds bounds;
        public List<SpawnPointData> spawnPoints;
        public List<NeutralPointCaptureData> neutralPointCaptures;  // 거점 점령 정보
        public List<SafetyZoneData> safetyZones;  // 안전 구역 정보
    }
    
    [Serializable]
    private class MeshesData
    {
        public List<MeshObjectData> meshObjects;
    }
    
    [Serializable]
    private class NavMeshExportData
    {
        public NavMeshData navMesh;
    }
    
    // 텍스처 파일 매핑 (텍스처 ID → 파일명)
    private Dictionary<string, string> textureFileMap = new Dictionary<string, string>();
    
    private void ExportTexturesToFiles(string folder)
    {
        var meshFilters = FindObjectsOfType<MeshFilter>();
        HashSet<string> exportedTextures = new HashSet<string>();
        
        int total = meshFilters.Length;
        int current = 0;
        
        foreach (var mf in meshFilters)
        {
            current++;
            if (current % 20 == 0)
                EditorUtility.DisplayProgressBar("텍스처 내보내기", $"{current}/{total}", (float)current / total);
            
            // 비활성화된 오브젝트 제외
            if (!mf.gameObject.activeInHierarchy) continue;
            
            var renderer = mf.GetComponent<Renderer>();
            if (renderer == null || !renderer.enabled || renderer.sharedMaterial == null) continue;
            
            var mat = renderer.sharedMaterial;
            
            // 메인 텍스처
            string[] texProps = { "_MainTex", "_BaseMap", "_BaseColorMap", "_Albedo", "_DiffuseMap" };
            foreach (var prop in texProps)
            {
                if (mat.HasProperty(prop))
                {
                    Texture tex = mat.GetTexture(prop);
                    if (tex != null && !exportedTextures.Contains(tex.name))
                    {
                        ExportTextureToFile(tex, folder);
                        exportedTextures.Add(tex.name);
                    }
                    break;
                }
            }
        }
        
        EditorUtility.ClearProgressBar();
    }
    
    private void ExportTextureToFile(Texture texture, string folder)
    {
        if (texture == null) return;
        
        string texId = texture.GetInstanceID().ToString();
        if (textureFileMap.ContainsKey(texId)) return;
        
        try
        {
            int size = Mathf.Min(Mathf.Max(texture.width, texture.height), textureMaxSize);
            
            RenderTexture rt = RenderTexture.GetTemporary(size, size, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
            Graphics.Blit(texture, rt);
            
            RenderTexture prev = RenderTexture.active;
            RenderTexture.active = rt;
            
            Texture2D tex2D = new Texture2D(size, size, TextureFormat.RGB24, false);
            tex2D.ReadPixels(new Rect(0, 0, size, size), 0, 0);
            tex2D.Apply();
            
            RenderTexture.active = prev;
            RenderTexture.ReleaseTemporary(rt);
            
            // 파일명 정리 (특수문자 제거)
            string safeName = string.Join("_", texture.name.Split(Path.GetInvalidFileNameChars()));
            string fileName = $"{safeName}.jpg";
            string filePath = Path.Combine(folder, fileName);
            
            // 중복 방지
            int counter = 1;
            while (File.Exists(filePath))
            {
                fileName = $"{safeName}_{counter}.jpg";
                filePath = Path.Combine(folder, fileName);
                counter++;
            }
            
            byte[] bytes = tex2D.EncodeToJPG(75);
            File.WriteAllBytes(filePath, bytes);
            
            DestroyImmediate(tex2D);
            
            textureFileMap[texId] = fileName;
            Debug.Log($"[SceneMeshExporter] 텍스처 저장: {fileName} ({size}x{size})");
        }
        catch (Exception e)
        {
            Debug.LogError($"[SceneMeshExporter] 텍스처 저장 실패 ({texture.name}): {e.Message}");
        }
    }
    
    private string ExportSceneDataWithTextureFiles()
    {
        var exportData = new ExportData
        {
            sceneName = SceneManager.GetActiveScene().name,
            exportTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            meshObjects = new List<MeshObjectData>(),
            markers = feedbackMarkers,
            textureFiles = new List<string>()  // 텍스처 파일명 목록만
        };
        
        Bounds sceneBounds = new Bounds();
        bool boundsInit = false;
        
        // NavMesh
        if (exportNavMesh)
            exportData.navMesh = ExportNavMeshData();
        
        // 메시
        if (exportMeshes)
        {
            var meshFilters = FindObjectsOfType<MeshFilter>();
            string[] excludePatterns = { "Sky_Default", "Sky_", "Skybox", "SkyDome" };
            
            foreach (var mf in meshFilters)
            {
                // 비활성화된 오브젝트 제외
                if (!mf.gameObject.activeInHierarchy) continue;
                if (mf.sharedMesh == null) continue;
                
                bool exclude = false;
                foreach (var p in excludePatterns)
                    if (mf.gameObject.name.Contains(p)) { exclude = true; break; }
                if (exclude) continue;
                
                var renderer = mf.GetComponent<Renderer>();
                if (renderer == null || !renderer.enabled) continue;
                
                var meshData = CreateMeshObjectDataWithTextureFile(mf.gameObject, mf.sharedMesh, renderer);
                if (meshData != null)
                {
                    exportData.meshObjects.Add(meshData);
                    if (!boundsInit) { sceneBounds = renderer.bounds; boundsInit = true; }
                    else sceneBounds.Encapsulate(renderer.bounds);
                }
            }
        }
        
        exportData.bounds = new SceneBounds
        {
            min = new Vector3Data(sceneBounds.min),
            max = new Vector3Data(sceneBounds.max),
            center = new Vector3Data(sceneBounds.center),
            size = new Vector3Data(sceneBounds.size)
        };
        
        return JsonUtility.ToJson(exportData, true);
    }
    
    private MeshObjectData CreateMeshObjectDataWithTextureFile(GameObject go, Mesh mesh, Renderer renderer)
    {
        var data = new MeshObjectData
        {
            name = go.name,
            path = GetGameObjectPath(go),
            layer = LayerMask.LayerToName(go.layer),
            tag = go.tag,
            isStatic = go.isStatic,
            transform = new TransformData
            {
                position = new Vector3Data(go.transform.position),
                rotation = new Vector3Data(go.transform.eulerAngles),
                scale = new Vector3Data(go.transform.lossyScale)
            }
        };
        
        // Geometry (normals 제거 - 용량 절감)
        Vector3[] verts = mesh.vertices;
        int[] tris = mesh.triangles;
        
        var worldVerts = new List<Vector3Data>();
        Matrix4x4 ltw = go.transform.localToWorldMatrix;
        
        foreach (var v in verts)
            worldVerts.Add(new Vector3Data(ltw.MultiplyPoint3x4(v)));
        
        // UV (메인 UV만)
        var uvList = new List<Vector2Data>();
        if (mesh.uv != null && mesh.uv.Length > 0)
            foreach (var uv in mesh.uv)
                uvList.Add(new Vector2Data(uv));
        
        data.geometry = new MeshGeometry
        {
            vertices = worldVerts,
            triangles = tris.ToList(),
            uvs = (exportUVs && uvList.Count > 0) ? uvList : null,
            bounds = new BoundsData
            {
                center = new Vector3Data(renderer.bounds.center),
                size = new Vector3Data(renderer.bounds.size)
            }
        };
        
        // Material
        if (renderer.sharedMaterial != null)
        {
            var mat = renderer.sharedMaterial;
            Color color = mat.HasProperty("_Color") ? mat.color : Color.gray;
            
            data.material = new MaterialInfo
            {
                name = mat.name,
                color = new ColorData(color),
                shaderName = mat.shader.name,
                mainTextureTiling = new Vector2Data(mat.mainTextureScale),
                mainTextureOffset = new Vector2Data(mat.mainTextureOffset),
                lightmapIndex = -1
            };
            
            // 텍스처 파일 참조
            string[] texProps = { "_MainTex", "_BaseMap", "_BaseColorMap", "_Albedo", "_DiffuseMap" };
            foreach (var prop in texProps)
            {
                if (mat.HasProperty(prop))
                {
                    Texture tex = mat.GetTexture(prop);
                    if (tex != null)
                    {
                        string texId = tex.GetInstanceID().ToString();
                        if (textureFileMap.ContainsKey(texId))
                            data.material.mainTextureId = textureFileMap[texId]; // 파일명 저장
                        
                        // 해당 텍스처의 타일링/오프셋 값 (프로퍼티별로 다를 수 있음)
                        Vector2 scale = mat.GetTextureScale(prop);
                        Vector2 offset = mat.GetTextureOffset(prop);
                        data.material.mainTextureTiling = new Vector2Data(scale);
                        data.material.mainTextureOffset = new Vector2Data(offset);
                    }
                    break;
                }
            }
        }
        
        return data;
    }
    
    private string ExportSceneData()
    {
        // 캐시 초기화
        textureCache.Clear();
        
        var exportData = new ExportData
        {
            sceneName = SceneManager.GetActiveScene().name,
            exportTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            meshObjects = new List<MeshObjectData>(),
            markers = feedbackMarkers,
            textureFiles = new List<string>()  // 텍스처 파일명 목록만
        };
        
        Bounds sceneBounds = new Bounds();
        bool boundsInitialized = false;
        
        // 라이트맵 제거 (용량 절감)
        
        // NavMesh 내보내기
        if (exportNavMesh)
        {
            exportData.navMesh = ExportNavMeshData();
        }
        
        // Mesh 오브젝트 내보내기
        if (exportMeshes)
        {
            var meshFilters = FindObjectsOfType<MeshFilter>();
            int total = meshFilters.Length;
            int current = 0;
            
            // 제외할 오브젝트 이름 패턴 (Sky_Default는 포함)
            string[] excludePatterns = { "Skybox", "SkyDome" };
            
            foreach (var mf in meshFilters)
            {
                current++;
                if (current % 10 == 0)
                {
                    EditorUtility.DisplayProgressBar("메시 내보내기", $"{current}/{total}", (float)current / total);
                }
                
                // 비활성화된 오브젝트 제외
                if (!mf.gameObject.activeInHierarchy) continue;
                if (mf.sharedMesh == null) continue;
                
                // 제외 패턴 체크
                bool shouldExclude = false;
                foreach (var pattern in excludePatterns)
                {
                    if (mf.gameObject.name.Contains(pattern))
                    {
                        shouldExclude = true;
                        Debug.Log($"[SceneMeshExporter] 제외됨: {mf.gameObject.name}");
                        break;
                    }
                }
                if (shouldExclude) continue;
                
                var renderer = mf.GetComponent<Renderer>();
                if (renderer == null || !renderer.enabled) continue;
                
                // 너무 작은 메시 제외
                if (mf.sharedMesh.vertexCount < minVerticesPerMesh) continue;
                
                var meshData = CreateMeshObjectData(mf.gameObject, mf.sharedMesh, renderer, exportData);
                if (meshData != null)
                {
                    exportData.meshObjects.Add(meshData);
                    
                    // 바운드 계산
                    if (!boundsInitialized)
                    {
                        sceneBounds = renderer.bounds;
                        boundsInitialized = true;
                    }
                    else
                    {
                        sceneBounds.Encapsulate(renderer.bounds);
                    }
                }
            }
            
            EditorUtility.ClearProgressBar();
        }
        
        // 용량 분석 로그
        int totalVerts = 0, totalTris = 0, totalUVs = 0;
        foreach (var m in exportData.meshObjects)
        {
            if (m.geometry != null)
            {
                totalVerts += m.geometry.vertices?.Count ?? 0;
                totalTris += m.geometry.triangles?.Count ?? 0;
                totalUVs += m.geometry.uvs?.Count ?? 0;
            }
        }
        Debug.Log($"[SceneMeshExporter] === 용량 분석 ===");
        Debug.Log($"[SceneMeshExporter] 메시 개수: {exportData.meshObjects.Count}");
        Debug.Log($"[SceneMeshExporter] 총 버텍스: {totalVerts:N0} (예상 {totalVerts * 15 / 1024}KB)");
        Debug.Log($"[SceneMeshExporter] 총 삼각형 인덱스: {totalTris:N0} (예상 {totalTris * 5 / 1024}KB)");
        Debug.Log($"[SceneMeshExporter] 총 UV: {totalUVs:N0} (예상 {totalUVs * 12 / 1024}KB)");
        Debug.Log($"[SceneMeshExporter] 예상 총 용량: {(totalVerts * 15 + totalTris * 5 + totalUVs * 12) / 1024 / 1024}MB");
        
        // Collider 내보내기
        if (exportColliders)
        {
            foreach (var collider in FindObjectsOfType<Collider>())
            {
                // MeshFilter가 없는 Collider만 처리
                if (collider.GetComponent<MeshFilter>() != null) continue;
                
                var meshData = CreateColliderMeshData(collider);
                if (meshData != null)
                {
                    exportData.meshObjects.Add(meshData);
                    
                    if (!boundsInitialized)
                    {
                        sceneBounds = collider.bounds;
                        boundsInitialized = true;
                    }
                    else
                    {
                        sceneBounds.Encapsulate(collider.bounds);
                    }
                }
            }
        }
        
        // 텍스처 파일명 목록만 저장 (Base64 제거로 용량 절감)
        foreach (var textureName in textureCache)
        {
            exportData.textureFiles.Add(textureName);
        }
        
        // 스폰 포인트 수집 (Player_01, Player_02, ... 패턴)
        exportData.spawnPoints = CollectSpawnPoints();
        if (exportData.spawnPoints.Count > 0)
        {
            Debug.Log($"[SceneMeshExporter] 스폰 포인트 {exportData.spawnPoints.Count}개 발견");
        }
        
        // 거점 점령 정보 수집 (NeutralPointCapture)
        exportData.neutralPointCaptures = CollectNeutralPointCaptures();
        if (exportData.neutralPointCaptures.Count > 0)
        {
            Debug.Log($"[SceneMeshExporter] 거점 점령 포인트 {exportData.neutralPointCaptures.Count}개 발견");
        }
        
        // 안전 구역 수집 (SafetyZone_)
        exportData.safetyZones = CollectSafetyZones();
        if (exportData.safetyZones.Count > 0)
        {
            Debug.Log($"[SceneMeshExporter] 안전 구역 {exportData.safetyZones.Count}개 발견");
        }
        
        // 씬 바운드 설정
        exportData.bounds = new SceneBounds
        {
            min = new Vector3Data(sceneBounds.min),
            max = new Vector3Data(sceneBounds.max),
            center = new Vector3Data(sceneBounds.center),
            size = new Vector3Data(sceneBounds.size)
        };
        
        return JsonUtility.ToJson(exportData, true);
    }
    
    // 스폰 포인트 수집 (Player_01, Player_02, ... 패턴)
    private List<SpawnPointData> CollectSpawnPoints()
    {
        var spawnPoints = new List<SpawnPointData>();
        
        // Player_XX 패턴의 오브젝트 찾기
        var allTransforms = FindObjectsOfType<Transform>();
        foreach (var t in allTransforms)
        {
            // Player_01, Player_02, ... 또는 SpawnPoint 패턴 체크
            string name = t.gameObject.name;
            if (name.StartsWith("Player_") || name.StartsWith("SpawnPoint") || name.Contains("Spawn"))
            {
                spawnPoints.Add(new SpawnPointData
                {
                    name = name,
                    position = new Vector3Data(t.position),
                    rotation = new Vector3Data(t.eulerAngles)
                });
                Debug.Log($"[SceneMeshExporter] 스폰 포인트 발견: {name} @ {t.position}");
            }
        }
        
        // 이름 순 정렬
        spawnPoints.Sort((a, b) => string.Compare(a.name, b.name));
        return spawnPoints;
    }
    
    // 거점 점령 정보 수집 (NeutralPointCaptureDescription 컴포넌트)
    private List<NeutralPointCaptureData> CollectNeutralPointCaptures()
    {
        var capturePoints = new List<NeutralPointCaptureData>();
        
        // 씬의 모든 오브젝트 수집 (비활성화 포함)
        var allGameObjects = GetAllGameObjectsInScene();
        Debug.Log($"[SceneMeshExporter] 전체 오브젝트 수: {allGameObjects.Count}");
        
        foreach (var go in allGameObjects)
        {
            // 이름에 NeutralPointCapture 또는 CapturePoint 포함된 오브젝트 찾기
            if (!go.name.Contains("NeutralPointCapture") && !go.name.Contains("CapturePoint"))
                continue;
            
            Debug.Log($"[SceneMeshExporter] 거점 후보 발견: {go.name}");
            
            // MonoBehaviour 컴포넌트들 검사
            var monoBehaviours = go.GetComponents<MonoBehaviour>();
            foreach (var mb in monoBehaviours)
            {
                if (mb == null) continue;
                
                var mbType = mb.GetType();
                
                // NeutralPointCaptureDescription 타입 체크
                if (mbType.Name.Contains("NeutralPointCapture") || mbType.Name.Contains("CaptureDescription"))
                {
                    var captureData = new NeutralPointCaptureData
                    {
                        name = go.name,
                        position = new Vector3Data(go.transform.position),
                        rotation = new Vector3Data(go.transform.eulerAngles)
                    };
                    
                    // Reflection으로 필드 값 추출 시도
                    try
                    {
                        // description 필드 찾기
                        var descField = mbType.GetField("description", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                        if (descField != null)
                        {
                            var desc = descField.GetValue(mb);
                            if (desc != null)
                            {
                                var descType = desc.GetType();
                                
                                // 각 필드 추출
                                captureData.uniqueID = GetFieldValue<int>(descType, desc, "uniqueID");
                                captureData.networkObjectID = GetFieldValue<int>(descType, desc, "networkObjectID");
                                captureData.radius = GetFieldValue<float>(descType, desc, "radius");
                                captureData.areaShape = GetFieldValue<int>(descType, desc, "areaShape");
                                captureData.activeDelayTime = GetFieldValue<float>(descType, desc, "ActiveDelayTime");
                                captureData.baseTime = GetFieldValue<float>(descType, desc, "baseTime");
                                captureData.k = GetFieldValue<float>(descType, desc, "k");
                                captureData.decay = GetFieldValue<float>(descType, desc, "decay");
                                captureData.tickInterval = GetFieldValue<float>(descType, desc, "tickInterval");
                                captureData.pointCaptureIndex = GetFieldValue<int>(descType, desc, "pointCaptureIndex");
                                
                                // description.position은 런타임 데이터이므로 무시
                                // 실제 위치는 go.transform.position (이미 설정됨)
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.LogWarning($"[SceneMeshExporter] 거점 정보 추출 중 오류 ({go.name}): {e.Message}");
                    }
                    
                    capturePoints.Add(captureData);
                    Debug.Log($"[SceneMeshExporter] 거점 점령 포인트 발견: {go.name} (ID: {captureData.uniqueID}, 반경: {captureData.radius})");
                    break;
                }
            }
        }
        
        // uniqueID 순 정렬
        capturePoints.Sort((a, b) => a.uniqueID.CompareTo(b.uniqueID));
        return capturePoints;
    }
    
    // Reflection 헬퍼 메서드
    private T GetFieldValue<T>(Type type, object obj, string fieldName)
    {
        var field = type.GetField(fieldName, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            var value = field.GetValue(obj);
            if (value is T result)
                return result;
        }
        return default(T);
    }
    
    // 안전 구역 수집 (SafetyZone_ 패턴의 BoxCollider)
    private List<SafetyZoneData> CollectSafetyZones()
    {
        var safetyZones = new List<SafetyZoneData>();
        
        // 씬의 모든 오브젝트 수집 (비활성화 포함)
        var allGameObjects = GetAllGameObjectsInScene();
        
        foreach (var go in allGameObjects)
        {
            // SafetyZone_ 패턴 체크
            if (!go.name.StartsWith("SafetyZone_") && !go.name.Contains("SafetyZone"))
                continue;
            
            // BoxCollider 찾기
            var boxCollider = go.GetComponent<BoxCollider>();
            if (boxCollider == null)
            {
                Debug.LogWarning($"[SceneMeshExporter] SafetyZone에 BoxCollider 없음: {go.name}");
                continue;
            }
            
            // 월드 좌표 계산
            Vector3 worldCenter = go.transform.TransformPoint(boxCollider.center);
            
            // 바운드 계산 (회전 고려)
            Bounds worldBounds = boxCollider.bounds;
            
            var zoneData = new SafetyZoneData
            {
                name = go.name,
                position = new Vector3Data(go.transform.position),
                rotation = new Vector3Data(go.transform.eulerAngles),
                center = new Vector3Data(boxCollider.center),
                size = new Vector3Data(boxCollider.size),
                worldCenter = new Vector3Data(worldCenter),
                worldMin = new Vector3Data(worldBounds.min),
                worldMax = new Vector3Data(worldBounds.max)
            };
            
            safetyZones.Add(zoneData);
            Debug.Log($"[SceneMeshExporter] 안전 구역 발견: {go.name} (크기: {boxCollider.size}, 위치: {worldCenter})");
        }
        
        // 이름 순 정렬
        safetyZones.Sort((a, b) => string.Compare(a.name, b.name));
        return safetyZones;
    }
    
    // 씬의 모든 게임 오브젝트 수집 (비활성화 포함)
    private List<GameObject> GetAllGameObjectsInScene()
    {
        var allObjects = new List<GameObject>();
        
        // 현재 씬의 모든 루트 오브젝트 가져오기
        var scene = SceneManager.GetActiveScene();
        var rootObjects = scene.GetRootGameObjects();
        
        foreach (var root in rootObjects)
        {
            CollectAllChildren(root.transform, allObjects);
        }
        
        return allObjects;
    }
    
    // 재귀적으로 모든 자식 오브젝트 수집
    private void CollectAllChildren(Transform parent, List<GameObject> list)
    {
        list.Add(parent.gameObject);
        
        foreach (Transform child in parent)
        {
            CollectAllChildren(child, list);
        }
    }
    
    private NavMeshData ExportNavMeshData()
    {
        NavMeshTriangulation navMeshData = NavMesh.CalculateTriangulation();
        
        if (navMeshData.vertices.Length == 0)
            return null;
        
        var data = new NavMeshData
        {
            vertices = new List<Vector3Data>(),
            indices = new List<int>()
        };
        
        foreach (var v in navMeshData.vertices)
        {
            data.vertices.Add(new Vector3Data(v));
        }
        
        data.indices.AddRange(navMeshData.indices);
        
        return data;
    }
    
    // ExportLightmaps 제거됨 - 용량 절감을 위해 라이트맵 내보내기 비활성화
    
    private string TextureToBase64(Texture texture, int maxSize)
    {
        if (texture == null) return null;
        
        try
        {
            int width = Mathf.Min(texture.width, maxSize);
            int height = Mathf.Min(texture.height, maxSize);
            
            // RenderTexture로 복사 (모든 텍스처 타입 지원)
            RenderTexture rt = RenderTexture.GetTemporary(
                width, height, 0,
                RenderTextureFormat.ARGB32,
                RenderTextureReadWrite.sRGB
            );
            rt.filterMode = FilterMode.Bilinear;
            
            // 이전 활성 RT 저장
            RenderTexture previous = RenderTexture.active;
            
            // Blit으로 복사
            Graphics.Blit(texture, rt);
            
            // 읽기
            RenderTexture.active = rt;
            Texture2D readableTexture = new Texture2D(width, height, TextureFormat.RGB24, false);
            readableTexture.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            readableTexture.Apply();
            
            // 정리
            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(rt);
            
            // JPG 인코딩 (품질 50으로 파일 크기 감소)
            byte[] bytes = readableTexture.EncodeToJPG(50);
            DestroyImmediate(readableTexture);
            
            if (bytes == null || bytes.Length == 0)
            {
                Debug.LogWarning($"[SceneMeshExporter] 텍스처 인코딩 실패: {texture.name}");
                return null;
            }
            
            Debug.Log($"[SceneMeshExporter] 텍스처 변환 성공: {texture.name} ({width}x{height}, {bytes.Length / 1024}KB)");
            return "data:image/jpeg;base64," + Convert.ToBase64String(bytes);
        }
        catch (Exception e)
        {
            Debug.LogError($"[SceneMeshExporter] 텍스처 변환 실패 ({texture.name}): {e.Message}\n{e.StackTrace}");
            return null;
        }
    }
    
    private string GetOrCacheTexture(Texture texture, ExportData exportData)
    {
        if (texture == null) return null;
        
        // 텍스처 이름만 저장 (Base64 제거 - 용량 절감)
        string textureName = texture.name;
        
        if (!textureCache.Contains(textureName))
        {
            textureCache.Add(textureName);
            Debug.Log($"[SceneMeshExporter] 텍스처 참조: {textureName}");
        }
        
        return textureName;
    }
    
    private MeshObjectData CreateMeshObjectData(GameObject go, Mesh mesh, Renderer renderer, ExportData exportData = null)
    {
        var data = new MeshObjectData
        {
            name = go.name,
            path = GetGameObjectPath(go),
            layer = LayerMask.LayerToName(go.layer),
            tag = go.tag,
            isStatic = go.isStatic,
            transform = new TransformData
            {
                position = new Vector3Data(go.transform.position),
                rotation = new Vector3Data(go.transform.eulerAngles),
                scale = new Vector3Data(go.transform.lossyScale)
            }
        };
        
        // Geometry (normals 제거 - Three.js에서 자동 계산, 용량 절감)
        var worldVertices = new List<Vector3Data>();
        
        Vector3[] verts = mesh.vertices;
        int[] tris = mesh.triangles;
        
        // 단순화
        if (simplifyMesh && verts.Length > maxVerticesPerMesh)
        {
            int step = Mathf.CeilToInt((float)verts.Length / maxVerticesPerMesh);
            var simplifiedVerts = new List<Vector3>();
            var vertexMap = new Dictionary<int, int>();
            
            for (int i = 0; i < verts.Length; i += step)
            {
                vertexMap[i] = simplifiedVerts.Count;
                simplifiedVerts.Add(verts[i]);
            }
            
            var simplifiedTris = new List<int>();
            for (int i = 0; i < tris.Length; i += 3)
            {
                int i0 = (tris[i] / step) * step;
                int i1 = (tris[i + 1] / step) * step;
                int i2 = (tris[i + 2] / step) * step;
                
                if (vertexMap.ContainsKey(i0) && vertexMap.ContainsKey(i1) && vertexMap.ContainsKey(i2))
                {
                    int ni0 = vertexMap[i0];
                    int ni1 = vertexMap[i1];
                    int ni2 = vertexMap[i2];
                    
                    if (ni0 != ni1 && ni1 != ni2 && ni0 != ni2)
                    {
                        simplifiedTris.Add(ni0);
                        simplifiedTris.Add(ni1);
                        simplifiedTris.Add(ni2);
                    }
                }
            }
            
            verts = simplifiedVerts.ToArray();
            tris = simplifiedTris.ToArray();
        }
        
        // 월드 좌표로 변환
        Matrix4x4 localToWorld = go.transform.localToWorldMatrix;
        
        foreach (var v in verts)
        {
            worldVertices.Add(new Vector3Data(localToWorld.MultiplyPoint3x4(v)));
        }
        
        // UV 좌표 (메인 UV만, UV2/라이트맵 제거 - 용량 절감)
        var uvList = new List<Vector2Data>();
        
        if (exportTextures)
        {
            Vector2[] meshUvs = mesh.uv;
            
            if (meshUvs != null && meshUvs.Length > 0)
            {
                if (simplifyMesh && mesh.vertices.Length > maxVerticesPerMesh)
                {
                    int step = Mathf.CeilToInt((float)mesh.vertices.Length / maxVerticesPerMesh);
                    for (int i = 0; i < mesh.vertices.Length && uvList.Count < verts.Length; i += step)
                    {
                        if (i < meshUvs.Length)
                            uvList.Add(new Vector2Data(meshUvs[i]));
                    }
                }
                else
                {
                    foreach (var uv in meshUvs)
                    {
                        uvList.Add(new Vector2Data(uv));
                    }
                }
            }
        }
        
        data.geometry = new MeshGeometry
        {
            vertices = worldVertices,
            triangles = tris.ToList(),
            uvs = (exportUVs && uvList.Count > 0) ? uvList : null,
            bounds = new BoundsData
            {
                center = new Vector3Data(renderer.bounds.center),
                size = new Vector3Data(renderer.bounds.size)
            }
        };
        
        // Material 정보
        if (renderer.sharedMaterial != null)
        {
            var mat = renderer.sharedMaterial;
            Color color = mat.HasProperty("_Color") ? mat.color : Color.gray;
            
            data.material = new MaterialInfo
            {
                name = mat.name,
                color = new ColorData(color),
                shaderName = mat.shader.name,
                mainTextureTiling = new Vector2Data(mat.mainTextureScale),
                mainTextureOffset = new Vector2Data(mat.mainTextureOffset),
                lightmapIndex = renderer.lightmapIndex,
                lightmapScaleOffset = renderer.lightmapIndex >= 0 ? new Vector4Data(renderer.lightmapScaleOffset) : null
            };
            
            // 메인 텍스처 내보내기
            if (exportTextures && exportData != null)
            {
                // 메인 텍스처 - 여러 셰이더 프로퍼티 시도
                Texture mainTex = null;
                string mainTexProp = null;
                string[] mainTexProps = { "_MainTex", "_BaseMap", "_BaseColorMap", "_Albedo", "_DiffuseMap" };
                foreach (var prop in mainTexProps)
                {
                    if (mat.HasProperty(prop))
                    {
                        mainTex = mat.GetTexture(prop);
                        if (mainTex != null)
                        {
                            mainTexProp = prop;
                            Debug.Log($"[SceneMeshExporter] {go.name}: 메인 텍스처 발견 ({prop}): {mainTex.name}");
                            break;
                        }
                    }
                }
                
                if (mainTex != null)
                {
                    data.material.mainTextureId = GetOrCacheTexture(mainTex, exportData);
                    
                    // 해당 텍스처의 타일링/오프셋 값 (프로퍼티별로 다를 수 있음)
                    Vector2 scale = mat.GetTextureScale(mainTexProp);
                    Vector2 offset = mat.GetTextureOffset(mainTexProp);
                    data.material.mainTextureTiling = new Vector2Data(scale);
                    data.material.mainTextureOffset = new Vector2Data(offset);
                }
                else
                {
                    Debug.Log($"[SceneMeshExporter] {go.name}: 메인 텍스처 없음 (Material: {mat.name}, Shader: {mat.shader.name})");
                }
                
                // 노멀맵
                string[] normalProps = { "_BumpMap", "_NormalMap", "_Normal" };
                foreach (var prop in normalProps)
                {
                    if (mat.HasProperty(prop))
                    {
                        Texture normalTex = mat.GetTexture(prop);
                        if (normalTex != null)
                        {
                            data.material.normalTextureId = GetOrCacheTexture(normalTex, exportData);
                            break;
                        }
                    }
                }
            }
        }
        else
        {
            data.material = new MaterialInfo
            {
                name = "Default",
                color = new ColorData(Color.gray),
                shaderName = "Unknown",
                mainTextureTiling = new Vector2Data(1f, 1f),
                mainTextureOffset = new Vector2Data(0f, 0f),
                lightmapIndex = -1
            };
        }
        
        return data;
    }
    
    private MeshObjectData CreateColliderMeshData(Collider collider)
    {
        Mesh colliderMesh = null;
        
        if (collider is BoxCollider box)
        {
            colliderMesh = CreateBoxMesh(box.size, box.center);
        }
        else if (collider is SphereCollider sphere)
        {
            colliderMesh = CreateSphereMesh(sphere.radius, sphere.center);
        }
        else if (collider is CapsuleCollider capsule)
        {
            colliderMesh = CreateCapsuleMesh(capsule);
        }
        else if (collider is MeshCollider meshCol && meshCol.sharedMesh != null)
        {
            colliderMesh = meshCol.sharedMesh;
        }
        
        if (colliderMesh == null) return null;
        
        var go = collider.gameObject;
        var data = new MeshObjectData
        {
            name = $"{go.name}_Collider",
            path = GetGameObjectPath(go) + "/Collider",
            layer = LayerMask.LayerToName(go.layer),
            tag = go.tag,
            isStatic = go.isStatic,
            transform = new TransformData
            {
                position = new Vector3Data(go.transform.position),
                rotation = new Vector3Data(go.transform.eulerAngles),
                scale = new Vector3Data(go.transform.lossyScale)
            }
        };
        
        // Geometry
        var worldVertices = new List<Vector3Data>();
        Matrix4x4 localToWorld = go.transform.localToWorldMatrix;
        
        foreach (var v in colliderMesh.vertices)
        {
            worldVertices.Add(new Vector3Data(localToWorld.MultiplyPoint3x4(v)));
        }
        
        data.geometry = new MeshGeometry
        {
            vertices = worldVertices,
            triangles = colliderMesh.triangles.ToList(),
            bounds = new BoundsData
            {
                center = new Vector3Data(collider.bounds.center),
                size = new Vector3Data(collider.bounds.size)
            }
        };
        
        data.material = new MaterialInfo
        {
            name = "Collider",
            color = new ColorData(new Color(0.2f, 0.8f, 0.2f, 0.5f)),
            shaderName = "Collider",
            mainTextureTiling = new Vector2Data(1f, 1f),
            mainTextureOffset = new Vector2Data(0f, 0f)
        };
        
        return data;
    }
    
    private Mesh CreateBoxMesh(Vector3 size, Vector3 center)
    {
        var mesh = new Mesh();
        
        Vector3 half = size * 0.5f;
        
        mesh.vertices = new Vector3[]
        {
            center + new Vector3(-half.x, -half.y, -half.z),
            center + new Vector3(half.x, -half.y, -half.z),
            center + new Vector3(half.x, half.y, -half.z),
            center + new Vector3(-half.x, half.y, -half.z),
            center + new Vector3(-half.x, -half.y, half.z),
            center + new Vector3(half.x, -half.y, half.z),
            center + new Vector3(half.x, half.y, half.z),
            center + new Vector3(-half.x, half.y, half.z)
        };
        
        mesh.triangles = new int[]
        {
            0, 2, 1, 0, 3, 2,
            4, 5, 6, 4, 6, 7,
            0, 1, 5, 0, 5, 4,
            2, 3, 7, 2, 7, 6,
            0, 4, 7, 0, 7, 3,
            1, 2, 6, 1, 6, 5
        };
        
        return mesh;
    }
    
    private Mesh CreateSphereMesh(float radius, Vector3 center, int segments = 16)
    {
        var mesh = new Mesh();
        var vertices = new List<Vector3>();
        var triangles = new List<int>();
        
        for (int lat = 0; lat <= segments; lat++)
        {
            float theta = lat * Mathf.PI / segments;
            float sinTheta = Mathf.Sin(theta);
            float cosTheta = Mathf.Cos(theta);
            
            for (int lon = 0; lon <= segments; lon++)
            {
                float phi = lon * 2 * Mathf.PI / segments;
                float sinPhi = Mathf.Sin(phi);
                float cosPhi = Mathf.Cos(phi);
                
                float x = cosPhi * sinTheta;
                float y = cosTheta;
                float z = sinPhi * sinTheta;
                
                vertices.Add(center + new Vector3(x, y, z) * radius);
            }
        }
        
        for (int lat = 0; lat < segments; lat++)
        {
            for (int lon = 0; lon < segments; lon++)
            {
                int first = (lat * (segments + 1)) + lon;
                int second = first + segments + 1;
                
                triangles.Add(first);
                triangles.Add(second);
                triangles.Add(first + 1);
                
                triangles.Add(second);
                triangles.Add(second + 1);
                triangles.Add(first + 1);
            }
        }
        
        mesh.vertices = vertices.ToArray();
        mesh.triangles = triangles.ToArray();
        
        return mesh;
    }
    
    private Mesh CreateCapsuleMesh(CapsuleCollider capsule, int segments = 12)
    {
        // 간단한 박스로 대체 (실제로는 더 정교하게 구현 가능)
        float height = capsule.height;
        float radius = capsule.radius;
        
        return CreateBoxMesh(
            new Vector3(radius * 2, height, radius * 2),
            capsule.center
        );
    }
    
    private string GetGameObjectPath(GameObject go)
    {
        string path = go.name;
        Transform parent = go.transform.parent;
        
        while (parent != null)
        {
            path = parent.name + "/" + path;
            parent = parent.parent;
        }
        
        return path;
    }
    
    private string GetEmbeddedViewerHtml()
    {
        // 완전한 내장 HTML 뷰어
        return @"<!DOCTYPE html>
<html lang='ko'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Scene Mesh Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; background: #0d1117; color: #f0f6fc; overflow: hidden; }
        #container { width: 100vw; height: 100vh; }
        #info { position: fixed; top: 20px; left: 20px; background: rgba(22,27,34,0.95); padding: 20px; border-radius: 12px; border: 1px solid #30363d; max-width: 300px; z-index: 100; }
        #info h1 { font-size: 1.2rem; margin-bottom: 10px; color: #58a6ff; }
        #info p { font-size: 0.85rem; color: #8b949e; margin-bottom: 8px; }
        .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #21262d; }
        .stat-label { color: #8b949e; }
        .stat-value { color: #3fb950; font-family: monospace; }
        #loading { position: fixed; inset: 0; background: #0d1117; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 200; }
        .spinner { width: 50px; height: 50px; border: 3px solid #30363d; border-top-color: #58a6ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(22,27,34,0.95); padding: 10px 20px; border-radius: 8px; border: 1px solid #30363d; font-size: 0.8rem; color: #8b949e; }
        kbd { background: #21262d; padding: 2px 6px; border-radius: 3px; margin: 0 3px; }
    </style>
</head>
<body>
    <div id='loading'><div class='spinner'></div><p style='margin-top:20px;color:#8b949e;'>데이터 로딩 중...</p></div>
    <div id='container'></div>
    <div id='info'>
        <h1>🗺️ Scene Viewer</h1>
        <p id='scene-name'>-</p>
        <div class='stat'><span class='stat-label'>메시 오브젝트</span><span class='stat-value' id='mesh-count'>0</span></div>
        <div class='stat'><span class='stat-label'>NavMesh 삼각형</span><span class='stat-value' id='nav-count'>0</span></div>
        <div class='stat'><span class='stat-label'>총 버텍스</span><span class='stat-value' id='vert-count'>0</span></div>
    </div>
    <div id='controls'><kbd>LMB</kbd>회전 <kbd>RMB</kbd>팬 <kbd>Scroll</kbd>줌</div>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'></script>
    <script>
        let scene, camera, renderer, controls;
        
        async function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0d1117);
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
            camera.position.set(50, 50, 50);
            
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById('container').appendChild(renderer.domElement);
            
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            
            scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const light = new THREE.DirectionalLight(0xffffff, 0.8);
            light.position.set(100, 150, 100);
            scene.add(light);
            
            scene.add(new THREE.GridHelper(500, 100, 0x30363d, 0x21262d));
            
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                loadData(data);
            } catch(e) {
                console.error('데이터 로드 실패:', e);
            }
            
            document.getElementById('loading').style.display = 'none';
            animate();
        }
        
        function loadData(data) {
            document.getElementById('scene-name').textContent = data.sceneName || '-';
            
            let totalVerts = 0;
            
            if (data.navMesh && data.navMesh.vertices) {
                const geo = new THREE.BufferGeometry();
                const verts = [];
                data.navMesh.vertices.forEach(v => verts.push(v.x, v.y, v.z));
                geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
                geo.setIndex(data.navMesh.indices);
                geo.computeVertexNormals();
                
                const mat = new THREE.MeshPhongMaterial({ color: 0x3fb950, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
                scene.add(new THREE.Mesh(geo, mat));
                
                document.getElementById('nav-count').textContent = Math.floor(data.navMesh.indices.length / 3).toLocaleString();
            }
            
            if (data.meshObjects) {
                data.meshObjects.forEach(obj => {
                    if (!obj.geometry || !obj.geometry.vertices) return;
                    
                    const geo = new THREE.BufferGeometry();
                    const verts = [];
                    obj.geometry.vertices.forEach(v => verts.push(v.x, v.y, v.z));
                    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
                    if (obj.geometry.triangles) geo.setIndex(obj.geometry.triangles);
                    geo.computeVertexNormals();
                    
                    let color = 0x58a6ff;
                    if (obj.material && obj.material.color) {
                        color = new THREE.Color(obj.material.color.r, obj.material.color.g, obj.material.color.b);
                    }
                    
                    const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
                    scene.add(new THREE.Mesh(geo, mat));
                    
                    totalVerts += obj.geometry.vertices.length;
                });
                
                document.getElementById('mesh-count').textContent = data.meshObjects.length.toLocaleString();
            }
            
            document.getElementById('vert-count').textContent = totalVerts.toLocaleString();
            
            if (data.bounds) {
                const c = data.bounds.center;
                controls.target.set(c.x, c.y, c.z);
                camera.position.set(c.x + 80, c.y + 60, c.z + 80);
            }
        }
        
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        init();
    </script>
</body>
</html>";
    }
    
    private void OnInspectorUpdate()
    {
        Repaint();
    }
}

