<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from "vue";
// @ts-ignore
import { ElMessage } from "element-plus";
import { gererateMermaidSync } from "../utils/openAI";
import mermaid from "mermaid";
import mkfLight from "../assets/mkf-light.svg";
import mkfDark from "../assets/mkf-dark.svg";
import textLight from "../assets/text-light.svg";
import textDark from "../assets/text-dark.svg";
import codeLight from "../assets/code-light.svg";
import codeDark from "../assets/code-dark.svg";
import nodataLight from "../assets/nodata-light.svg";
import nodataDark from "../assets/nodata-dark.svg";
import copyLight from "../assets/copy-light.svg";
import copyDark from "../assets/copy-dark.svg";
import svgLight from "../assets/svg-light.svg";
import svgDark from "../assets/svg-dark.svg";
import pngLight from "../assets/png-light.svg";
import pngDark from "../assets/png-dark.svg";
const theme = ref("dark");
const chart = ref<any>(null);
const diadramSvg = ref<any>(null);
const loading = ref(false);
const formData = reactive({
  prompt: "",
  chartType: "",
  showCode: false,
  code: `sequenceDiagram
    participant 用户
    participant DiagramGPT
    participant OpenAI
    participant Mermaid

    用户->>DiagramGPT: 输入图表的自然语言描述
    DiagramGPT->>OpenAI: 请求ChatGPT服务
    OpenAI-->>DiagramGPT: 返回Mermaid代码
    DiagramGPT->>Mermaid: 生成图表
    Mermaid-->>DiagramGPT: 将图表渲染到UI
    用户->>DiagramGPT: 保存图表`,
});

const codeSrc = computed(() => {
  return theme.value === "dark" ? codeDark : codeLight;
});

const textSrc = computed(() => {
  return theme.value === "dark" ? textDark : textLight;
});

const mkfSrc = computed(() => {
  return theme.value === "dark" ? mkfDark : mkfLight;
});

const nodataSrc = computed(() => {
  return theme.value === "dark" ? nodataDark : nodataLight;
});

const copySrc = computed(() => {
  return theme.value === "dark" ? copyDark : copyLight;
});

const svgSrc = computed(() => {
  return theme.value === "dark" ? svgDark : svgLight;
});

const pngSrc = computed(() => {
  return theme.value === "dark" ? pngDark : pngLight;
});

onMounted(() => {
  getStorage();
});

watch(
  () => theme.value,
  async (val) => {
    setStorage("theme", val);
    document.querySelector("html")?.setAttribute("class", val);
    renderInit();
  }
);

const renderInit = async () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme.value === "dark" ? "dark" : "neutral",
  });
  if (formData.code) {
    const { svg } = await mermaid.render("null", formData.code);
    await nextTick();
    chart.value.innerHTML = svg;
    diadramSvg.value = svg;
  }
};

const getStorage = () => {
  const storage = localStorage.getItem("diagramgpt");
  console.log(storage);
  if (storage) {
    const data = JSON.parse(storage);
    formData.prompt = data.prompt;
    formData.chartType = data.chartType;
    formData.code = data.code;
    theme.value = data.theme;
    renderInit();
  }
};

const setStorage = (key: string, value: string) => {
  const storage = localStorage.getItem("diagramgpt");
  let data: any = {};
  if (storage) {
    data = JSON.parse(storage);
  }
  data[key] = value;
  localStorage.setItem("diagramgpt", JSON.stringify(data));
};

const onSubmit = async () => {
  if (!formData.prompt && !formData.code) {
    ElMessage.error("请输入描述信息");
    return;
  }
  loading.value = true;
  try {
    let res = "";
    if (!formData.code) {
      res = await gererateMermaidSync(formData.prompt, formData.chartType);
      formData.code = res;
    } else {
      res = formData.code;
    }

    const { svg } = await mermaid.render("null", res);
    await nextTick();
    chart.value.innerHTML = svg;
    diadramSvg.value = svg;
    setStorage("prompt", formData.prompt);
    setStorage("chartType", formData.chartType);
    setStorage("code", formData.code);
  } finally {
    loading.value = false;
  }
};

const download = async (type: string) => {
  if (!diadramSvg.value) {
    ElMessage.error("请先生成图表");
    return;
  }
  function blobToBase64(blob: any) {
    return new Promise((resolve, reject) => {
      const reader: any = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result?.split(",")[1]);
      reader.onerror = (error: any) => reject(error);
    });
  }
  const blob = new Blob([diadramSvg.value], { type: "image/svg+xml" });
  const base64 = await blobToBase64(blob);
  const svg = chart.value.querySelector("svg");
  const svgWidth = Math.floor(svg.getBoundingClientRect().width * 2);
  const svgheight = Math.floor(svg.getBoundingClientRect().height * 2);
  console.log(svgWidth, svgheight);
  if (type === "copy" || type === "png") {
    const image = new Image();
    image.width = svgWidth;
    image.height = svgheight;
    image.src = "data:image/svg+xml;base64," + base64;
    image.onload = function () {
      const canvas = document.createElement("canvas");
      const cvWidth = chart.value.offsetWidth * 2;
      const cvHeight = chart.value.offsetHeight * 2;
      console.log(cvWidth, cvHeight);
      canvas.width = cvWidth;
      canvas.height = cvHeight;
      const ctx = canvas.getContext("2d");
      const gap = Math.floor((cvWidth - svgWidth) / 2);
      console.log(gap);
      ctx?.drawImage(image, gap, 0, svgWidth, svgheight);
      if (type === "png") {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "diagram.png";
        a.click();
      } else {
        canvas.toBlob((blob: any) => {
          writeImage(blob);
        });
      }
    };
    function writeImage(blob: Blob) {
      const data = [
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ];
      navigator.clipboard.write(data).then(
        () => {
          ElMessage.success("复制成功");
        },
        () => {
          ElMessage.error("复制失败");
        }
      );
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
  }
};

// 语音识别
const onVoice = () => {
  const win: any = window;
  const SpeechRecognition =
    win.SpeechRecognition || win.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  try {
    recognition.start();
    ElMessage.success("请开始讲话...");
    recognition.onresult = function (event: any) {
      const result = event.results[0][0].transcript;
      formData.prompt += result;
    };
  } catch (e) {
    ElMessage.error("语音识别失败");
  }
};

const setDef = (type: string) => {
  switch (type) {
    case "flowChart":
      formData.chartType = "flowChartTD流程图";
      formData.prompt = `1.有五个步骤:A商品检验,B商品检验,C是否合格（判断框）,D入库,E返工。
2.A指向B
3.B指向C
4.C指向D，描述：是
5.C指向E，描述：否
6.E指向B`;
      formData.code = "";
      break;
    case "sequence":
      formData.chartType = "sequenceDiagram时序图";
      formData.prompt = `1.有4个对象:用户,DiagramGPT,OpenAI,Mermaid。
2.用户指向DiagramGPT,描述：输入图表的自然语言描述.
3.DiagramGPT指向OpenAI，描述：请求ChatGPT服务.
4.OpenAI指向DiagramGPT，描述：返回Mermaid代码.
5.DiagramGPT指向Mermaid,描述：生成图表.
6.Mermaid指向DiagramGPT，描述：将图表渲染到UI.
7.用户指向DiagramGPT，描述：保存图表.`;
      formData.code = "";
      break;
    case "class":
      formData.chartType = "classDiagram类图";
      formData.prompt = `1.Animal有公共变量name，isPet,私有变量state,age,公共方法getName,setName.
2.Fish继承Animal,有公共变量fishType,公共方法swim.
3.Cat继承Animal,有公共变量catType,公共方法catchMouse.
4.Persion和Cat是关联关系,有变量pet,head.
5.Head和Person是组合关系
6.Doll有变量body,方法toyMoved，Cat依赖Doll
7.ToyAction和Doll是实现关系.
8.Body和Doll是聚合关系`;
      formData.code = "";
      break;
  }
};

const reset = () => {
  formData.prompt = "";
  formData.code = "";
  formData.chartType = "";
  formData.showCode = false;
  chart.value.innerHTML = "";
  diadramSvg.value = "";
  setStorage("prompt", "");
  setStorage("chartType", "");
  setStorage("code", "");
};
</script>

<template>
  <h2>DiagramGPT</h2>
  <el-switch
    class="theme-switch"
    v-model="theme"
    inline-prompt
    active-text="light"
    inactive-text="dark"
    active-value="light"
    inactive-value="dark"
    size="large"
  />
  <div class="btns">
    <el-button type="primary" @click="setDef('flowChart')"
      >流程图示例</el-button
    >
    <el-button type="primary" @click="setDef('sequence')">时序图示例</el-button>
    <el-button type="primary" @click="setDef('class')">类图示例</el-button>
  </div>
  <el-form :model="formData" class="form">
    <el-form-item>
      <el-input
        v-show="!formData.showCode"
        v-model="formData.prompt"
        :autosize="{ minRows: 5, maxRows: 5 }"
        type="textarea"
        placeholder="Please input your prompt"
        style="width: 100%"
      />
      <el-input
        v-show="formData.showCode"
        v-model="formData.code"
        :autosize="{
          minRows: 5,
          maxRows: 5,
        }"
        type="textarea"
        placeholder="Please input yourmermaid code"
        style="width: 100%"
      />
      <el-tooltip
        :content="formData.showCode ? '描述' : '代码'"
        placement="top"
      >
        <img
          class="showcode"
          :src="formData.showCode ? textSrc : codeSrc"
          @click="formData.showCode = !formData.showCode"
        />
      </el-tooltip>
      <el-tooltip content="语音识别" placement="top">
        <img
          v-show="!formData.showCode"
          class="mkf"
          :src="mkfSrc"
          @click="onVoice"
        />
      </el-tooltip>
    </el-form-item>
    <el-form-item>
      <el-select
        v-model="formData.chartType"
        placeholder="Select Chart Type"
        style="width: 100%"
      >
        <el-option label="流程图" value="flowChartTD流程图" />
        <el-option label="时序图" value="sequenceDiagram时序图" />
        <el-option label="类图" value="classDiagram类图" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <div style="display: flex; width: 100%">
        <el-button style="width: 80%" type="primary" @click="onSubmit">
          Generate
        </el-button>
        <el-button style="width: 20%" type="primary" @click="reset">
          Reset
        </el-button>
      </div>
    </el-form-item>
  </el-form>
  <pre
    v-show="diadramSvg"
    ref="chart"
    class="mermaid"
    v-loading="loading"
  ></pre>
  <div v-show="!diadramSvg" v-loading="loading" class="nodata">
    <img :src="nodataSrc" />
  </div>
  <div class="btns-right">
    <el-tooltip content="复制图片" placement="left">
      <img :src="copySrc" @click="download('copy')" />
    </el-tooltip>
    <el-tooltip content="保存SVG" placement="left">
      <img :src="svgSrc" @click="download('svg')" />
    </el-tooltip>
    <el-tooltip content="保存PNG" placement="left">
      <img :src="pngSrc" @click="download('png')" />
    </el-tooltip>
  </div>
  <div class="cr">Copyright© 2023 Evan</div>
</template>

<style scoped>
.form {
  width: 100%;
}
.mkf {
  cursor: pointer;
  width: 20px;
  height: 25px;
  position: absolute;
  right: -25px;
  bottom: 5px;
}
.showcode {
  cursor: pointer;
  width: 20px;
  height: 25px;
  position: absolute;
  right: -25px;
  top: 2px;
}
.btns {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  margin-top: 10px;
}

.btns-right {
  position: absolute;
  display: flex;
  flex-direction: column;
  right: 5px;
  top: 380px;
}

.btns-right img {
  width: 20px;
  height: 20px;
  margin-bottom: 10px;
  cursor: pointer;
}

.mermaid {
  width: 100%;
  /* min-height: 100px; */
  text-align: left;
  display: flex;
  justify-content: center;
}

.nodata {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.nodata img {
  width: 300px;
  height: 150px;
}

.theme-switch {
  position: absolute;
  right: 30px;
  top: 10px;
}

.cr {
  width: 100%;
  text-align: center;
  margin-top: 30px;
}
</style>
