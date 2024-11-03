console.log("Word Cloud component loading...");

import { Chart, LinearScale } from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";
import list from "../../../../.cache/deno/npm/registry.npmjs.org/postcss/8.4.47/lib/list.d.ts";

Chart.register(WordCloudController, WordElement, LinearScale);

export class WordCloud extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `<canvas class="word-cloud"></canvas>`;

    const list = document.getElementById("words");
    // the element will be replaced with outerHTML by another script listen to those changes
    if (list) {
      // add the event listener to parent element
      list.parentNode.addEventListener("DOMSubtreeModified", () => {
        const list = document.getElementById("words");
        new Promise((resolve) => {
          this.processSlotData(list as HTMLUListElement);
        });
      });
      this.processSlotData(list);
    }
  }

  processSlotData(list: HTMLUListElement) {
    // Select the <li> elements inside the slot
    const listItems = list.querySelectorAll("li[data-amount]");

    // Extract word and amount from each <li>
    const words = Array.from(listItems).map((li) => ({
      text: li.textContent!.trim(),
      weight: parseInt(li.getAttribute("data-amount")!, 10),
    }));

    if (
      this.words?.map((w) => w.text + w.weight).join("") ===
      words.map((w) => w.text + w.weight).join("")
    ) {
      console.log("Words are the same, skipping render");
      return;
    }

    this.words = words;

    // Render the word cloud
    this.renderWordCloud(words);
  }

  renderWordCloud(words: { text: string; weight: number }[]) {
    const canvas = this.querySelector(".word-cloud") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;

    if (words.length === 0) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = undefined;
      }
      return;
    }

    const sum = words.reduce((acc, word) => acc + word.weight, 0);

    if (this.chart === undefined) {
      // Create the word cloud chart
      this.chart = new Chart(ctx, {
        type: "wordCloud",
        data: {
          labels: words.map((word) => word.text),
          datasets: [
            {
              label: "Word Cloud",
              data: words.map(
                (word) => (word.weight / sum) * words.length * 8 + 15
              ),
            },
          ],
        },
        options: {
          elements: {
            word: {
              minRotation: 0,
              onClick: console.log,
            },
          },
        },
      });

      canvas.onclick = (evt) => {
        const res = this.chart.getElementsAtEventForMode(
          evt,
          "nearest",
          { intersect: true },
          true
        );
        // If didn't click on a bar, `res` will be an empty array
        if (res.length === 0) {
          return;
        }
        // Alerts "You clicked on A" if you click the "A" chart
        const label = this.chart.data.labels[res[0].index];
        fetch("/api/action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "wordcloud.add",
            text: label,
          }),
        }).catch((error) => {
          console.error(error);
        });
      };
    } else {
      this.chart.data.labels = words.map((word) => word.text);
      this.chart.data.datasets[0].data = words.map(
        (word) => (word.weight / sum) * words.length * 8 + 15
      );
      this.chart.update();
    }
    console.log(words);
  }
}
