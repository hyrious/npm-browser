<template>
  <Header></Header>
  <SplitPane>
    <template #left>
      <Explorer />
    </template>
    <template #right>
      <Editor />
      <QuickOpen />
    </template>
  </SplitPane>
  <Footer></Footer>
</template>
