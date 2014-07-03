using System;
using System.Collections.Generic;
using System.IO;
using System.IO.IsolatedStorage;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Browser;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;

namespace evercookie
{
    public partial class MainPage : UserControl
    {
        private static string isoFile = "evercookie_isoData.txt";
        public static TextBox output;
        public MainPage()
        {
            InitializeComponent();
            output = txtOut;
        }

        [ScriptableMember()]
        public string getIsolatedStorage()
        {
            output.Text += "Loading isoData...\n";
            string data = String.Empty;
            using (IsolatedStorageFile isf = IsolatedStorageFile.GetUserStoreForApplication())
            {
                using (IsolatedStorageFileStream isfs = new IsolatedStorageFileStream(isoFile, FileMode.Open, isf))
                {
                    using (StreamReader sr = new StreamReader(isfs))
                    {
                        string lineOfData = String.Empty;
                        while ((lineOfData = sr.ReadLine()) != null)
                        {
                            data += lineOfData;
                            output.Text += "Loading: " + lineOfData + "\n";
                        }
                    }
                }
            }
            return data;
        }

        public static void save(string name, string value)
        {
            output.Text += "Saving: " + name + "=" + value + "\n";
            using (IsolatedStorageFile isf = IsolatedStorageFile.GetUserStoreForApplication())
            {
                using (IsolatedStorageFileStream isfs = new IsolatedStorageFileStream(isoFile, FileMode.Create, isf))
                {
                    using (StreamWriter sw = new StreamWriter(isfs))
                    {
                        sw.Write(name+"="+value);
                        sw.Close();
                    }
                }
            }
        }
    }
}
