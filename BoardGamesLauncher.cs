using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

class BoardGamesLauncher : Form
{
    const int Port = 18736;
    static readonly string Url = "http://localhost:" + Port + "/omok.html";
    static readonly string[] Files = { "omok.html", "chess.html", "janggi.html", "baduk.html" };
    readonly Dictionary<string, byte[]> assets = new Dictionary<string, byte[]>();
    TcpListener listener;
    volatile bool running;

    BoardGamesLauncher()
    {
        Text = "돌과 바람 · 보드게임";
        Width = 470; Height = 230;
        StartPosition = FormStartPosition.CenterScreen;
        var label = new Label { Left = 20, Top = 20, Width = 420, Height = 75, Text = "오목 · 체스 · 장기 · 바둑을\n인터넷 없이 실행합니다.\n게임을 닫을 때까지 이 창을 열어 두세요." };
        var open = new Button { Left = 20, Top = 112, Width = 180, Height = 35, Text = "게임 열기" };
        open.Click += delegate { OpenGame(); };
        Controls.Add(label); Controls.Add(open);
        LoadAssets();
        listener = new TcpListener(IPAddress.Loopback, Port);
        listener.Start(); running = true;
        new Thread(Serve) { IsBackground = true }.Start();
        Shown += delegate { OpenGame(); };
        FormClosing += delegate { running = false; listener.Stop(); };
    }

    void LoadAssets()
    {
        foreach (string file in Files)
        {
            using (Stream input = Assembly.GetExecutingAssembly().GetManifestResourceStream(file))
            {
                if (input == null) throw new IOException("Missing embedded file: " + file);
                using (var buffer = new MemoryStream()) { input.CopyTo(buffer); assets[file] = buffer.ToArray(); }
            }
        }
    }

    void OpenGame() { try { Process.Start(new ProcessStartInfo(Url) { UseShellExecute = true }); } catch (Exception ex) { MessageBox.Show(ex.Message); } }

    void Serve()
    {
        while (running) try { var client = listener.AcceptTcpClient(); ThreadPool.QueueUserWorkItem(delegate { HandleRequest(client); }); }
        catch (SocketException) { if (!running) return; }
    }

    void HandleRequest(TcpClient client)
    {
        using (client) try
        {
            using (var stream = client.GetStream()) using (var reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true))
            {
                string request = reader.ReadLine(); if (request == null) return;
                var parts = request.Split(' '); if (parts.Length < 2) return;
                string line; while (!String.IsNullOrEmpty(line = reader.ReadLine())) { }
                string path = parts[1].Split('?')[0].TrimStart('/'); if (path.Length == 0) path = "omok.html";
                byte[] bytes; bool found = assets.TryGetValue(path, out bytes);
                if (!found) bytes = Encoding.UTF8.GetBytes("Not found");
                string type = "text/html; charset=utf-8";
                string header = "HTTP/1.1 " + (found ? "200 OK" : "404 Not Found") + "\r\nContent-Type: " + type + "\r\nContent-Length: " + bytes.Length + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n";
                byte[] h = Encoding.ASCII.GetBytes(header); stream.Write(h, 0, h.Length); stream.Write(bytes, 0, bytes.Length);
            }
        }
        catch (IOException) { }
        catch (SocketException) { }
    }

    [STAThread]
    static int Main()
    {
        Application.EnableVisualStyles();
        try { Application.Run(new BoardGamesLauncher()); return 0; }
        catch (SocketException) { MessageBox.Show("실행기가 이미 열려 있거나 포트 18736이 사용 중입니다."); return 2; }
        catch (Exception ex) { MessageBox.Show("실행 오류: " + ex.Message); return 1; }
    }
}
