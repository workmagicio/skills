# 安装 `lift-test-apply-design` skill —— 给 AI Agent 的说明(可用 URL 交付)

> **给用户的用法**:把本文件的链接发给任意能读网页、能写本地文件的 AI agent,并说:
> 「阅读这个 URL,按里面的步骤把这个 skill 装到我本地。」
>
> **给 Agent 的任务**:读完本文件,在用户本地创建 `lift-test-apply-design` skill **以及它的依赖** `lift-test-group-schema`。两个都要装,缺一不可。所需文件全部来自下面这个仓库,你自己去取。

---

## 1. 来源(你去这里取文件)

| 项 | 值 |
|---|---|
| 仓库 | `https://github.com/workmagicio/skills` |
| 分支 | `master` |
| skill 路径 | `skills/lift-test-apply-design/`、`skills/lift-test-group-schema/` |
| Raw 文件模板 | `https://raw.githubusercontent.com/workmagicio/skills/master/<相对路径>` |

> 想在合并到 master 前先测:把上面的 `master` 换成对应分支名即可。

## 2. 装到哪里(用户本地)

Claude Code 只扫描这两处,二选一(默认用个人级;如用户指定某项目则用项目级):

- 个人级(所有项目可用):`~/.claude/skills/`
- 项目级(随某仓库共享):`<项目根>/.claude/skills/`

下文用 `$DST` 代指所选目录。

> **重要 —— 落地文件时用绝对路径。** `~` / `$DST` 只有终端(shell)会展开;如果你用**文件写入工具**(非终端)写文件,必须先把目标解析成**绝对路径**再写:
> 1. 取用户 home 的绝对路径 —— 终端跑 `echo $HOME`(macOS 一般是 `/Users/<用户名>`、Linux `/home/<用户名>`、Windows `%USERPROFILE%` 即 `C:\Users\<用户名>`);拿不到就直接问用户。
> 2. 把 `~/.claude/skills` 展开成形如 `/Users/<用户名>/.claude/skills`;之后所有 `$DST/...` 都用这个**绝对路径**。
> 3. **不要把带 `~` 的路径直接传给文件写入工具** —— 多数写入工具不展开 `~`,会写到错误位置或直接报错。

## 3. 必须成对安装(硬约束)

`lift-test-apply-design` 依赖同级 skill `lift-test-group-schema`(其正文要求“先读它、按它校验”,并用相对链接 `../lift-test-group-schema/SKILL.md` 指过去)。因此:

- **两个 skill 都要装**。
- 两者必须落在**同一父目录 `$DST` 下、互为同级目录**,且目录名保持 `lift-test-apply-design` 与 `lift-test-group-schema` **不变**(改名或不同级 → 断链)。

## 4. 需要落地的文件(必需)

```
$DST/lift-test-apply-design/SKILL.md
$DST/lift-test-apply-design/references/queries.md
$DST/lift-test-apply-design/references/lift-test-sync.md
$DST/lift-test-apply-design/references/worked-example-2608.md
$DST/lift-test-group-schema/SKILL.md
$DST/lift-test-group-schema/references/objects.md
```

> `README.md` / `INSTALL.md` 是仓库文档,**不影响 skill 运行**,可装可不装。

## 5. 安装步骤

### 方式 A —— `npx skills`(最省事,优先用这个)

Vercel Labs 的 skills CLI 以 GitHub 为 registry,支持本仓库的 `skills/<name>/SKILL.md` 子目录布局,并能直接装到 Claude Code:

```bash
npx skills add workmagicio/skills -a claude-code \
  --skill lift-test-apply-design \
  --skill lift-test-group-schema
```

- **两个 `--skill` 都要写**:该 CLI 不认我们这对 skill 的依赖关系,只写 apply-design 不会自动带上 group-schema(会断链)。
- **它装的是默认分支**(本仓库 = `master`),且**没有 branch 参数** —— 所以这两个 skill 必须已存在/合并到 `master` 才装得到。
- 先看仓库里有哪些 skill:`npx skills add workmagicio/skills --list`。
- 不加 `-a` 时它会自动探测你已装的 agent;`-a claude-code` 是显式装到 `~/.claude/skills/`(或项目 `.claude/skills/`)。
- **装完务必跑第 6 节校验**:重点确认 `references/*.md` 也落地了。若发现只拿到 `SKILL.md`、`references/` 缺失,改用下面的方式 B / C 重装(它们一定带齐所有文件)。

### 方式 B —— git clone + 拷贝(最稳,一定带齐所有文件)

```bash
DST=~/.claude/skills                    # 或 <项目根>/.claude/skills
mkdir -p "$DST"
tmp="$(mktemp -d)"
git clone --depth 1 --branch master https://github.com/workmagicio/skills.git "$tmp"
cp -R "$tmp/skills/lift-test-apply-design" "$DST/"
cp -R "$tmp/skills/lift-test-group-schema" "$DST/"
rm -rf "$tmp"
```

### 方式 C —— 只能联网 + 写文件(没有 git/终端)

**先按第 2 节把 `$DST` 解析成绝对路径**(文件写入工具不认 `~`)。然后建目录,再按「第 4 节」清单逐个 fetch Raw URL、写到对应本地路径(下面命令里的 `$DST` 都换成绝对路径;用写入工具时,写文件通常会自动创建父目录):

```
mkdir -p $DST/lift-test-apply-design/references
mkdir -p $DST/lift-test-group-schema/references
```

对清单里每个文件:
`fetch https://raw.githubusercontent.com/workmagicio/skills/master/skills/<skill>/<相对文件>`
→ 原样写入 `$DST/<skill>/<相对文件>`。
例:把 `.../master/skills/lift-test-apply-design/SKILL.md` 写到 `<$DST 绝对路径>/lift-test-apply-design/SKILL.md`,即形如 `/Users/<用户名>/.claude/skills/lift-test-apply-design/SKILL.md`。

> 如果你只被给到 `lift-test-apply-design` 一个 skill、拿不到 `lift-test-group-schema`,也**不要只装一个**:从上面仓库补齐依赖;实在取不到就停下,告诉用户“还需要 lift-test-group-schema 才能装完”。

## 6. 校验(装完必跑)

```bash
for f in \
  lift-test-apply-design/SKILL.md \
  lift-test-apply-design/references/queries.md \
  lift-test-apply-design/references/lift-test-sync.md \
  lift-test-apply-design/references/worked-example-2608.md \
  lift-test-group-schema/SKILL.md \
  lift-test-group-schema/references/objects.md ; do
  test -f "$DST/$f" && echo "OK   $f" || echo "MISS $f"
done
# 关键:apply-design 用到的跨 skill 相对链接能解析到实体文件
test -f "$DST/lift-test-apply-design/../lift-test-group-schema/SKILL.md" && echo "cross-link OK"
```

全部 OK 后,让用户**重启 Claude Code** 或运行 `/skills`,确认列表里出现 `lift-test-apply-design` 与 `lift-test-group-schema`。

## 7. 装好之后怎么被触发

Claude Code 读 frontmatter 的 `description` 自动匹配、自动唤醒,无需手动调用。触发语例:

- 「把某个 design 回填/换进 lift_test_group 的 geo_group」
- 「给 design_id 生成改 geo pairing 的 update sql」
- 「apply / swap online design into a lift test group」

**运行前置**:apply-design 需要**只读仓库查询工具**(能读 `platform.*` 业务库表)做前置探查;它产出的 `UPDATE` 只读工具跑不了,需用户在业务库(platform-api 的 `api` 数据源)执行。

## ⚠ 安全提示(请转达用户)

这两个是**内部运维 skill**,会生成**直接改生产业务库的 `UPDATE`**(乃至已上线实验的运行期数据)。装好只代表 agent 会“生成 SQL”;**是否执行由用户人工把关**。设计上每条正向 `UPDATE` 都会配一条**回滚 `UPDATE`**(整列还原改动前原值),执行前请先留好回滚语句。
